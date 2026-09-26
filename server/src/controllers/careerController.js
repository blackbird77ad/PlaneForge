import { CareerApplication } from '../models/CareerApplication.js';
import { CareerPosition } from '../models/CareerPosition.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const applicationStatuses = ['new', 'under_review', 'shortlisted', 'assessment', 'interview', 'selected', 'rejected', 'withdrawn'];
const positionStatuses = ['draft', 'published', 'closed', 'archived'];

const textSearch = (search, fields) => {
  if (!search?.trim()) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const pagination = ({ page = 1, limit = 25 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  return { safeLimit, currentPage, skip: (currentPage - 1) * safeLimit };
};

const now = () => new Date();

const isDeadlinePassed = (position, date = now()) =>
  Boolean(position.applicationDeadline && new Date(position.applicationDeadline) <= date);

const effectiveStatus = (position, date = now()) => {
  if (position.status === 'published' && position.autoClose !== false && isDeadlinePassed(position, date)) {
    return 'closed';
  }
  return position.status;
};

const isPubliclyVisible = (position, date = now()) => {
  if (!position || position.status === 'archived' || position.status === 'draft') return false;
  if (position.publishAt && new Date(position.publishAt) > date) return false;

  const status = effectiveStatus(position, date);
  if (status === 'published') return true;
  if (status !== 'closed') return false;
  if (position.closingBehavior === 'remove') return false;
  if (position.closingBehavior === 'keep_temporarily') {
    return Boolean(position.closedVisibleUntil && new Date(position.closedVisibleUntil) > date);
  }
  return position.closingBehavior === 'keep_closed';
};

const canAcceptApplications = (position, date = now()) =>
  isPubliclyVisible(position, date) && effectiveStatus(position, date) === 'published' && !isDeadlinePassed(position, date);

const toTextItems = (items = []) =>
  Array.isArray(items)
    ? items.map((item) => (typeof item === 'string' ? { text: item } : { text: String(item.text || '').trim() })).filter((item) => item.text)
    : [];

const sanitizePositionInput = (body = {}) => ({
  title: String(body.title || '').trim(),
  hiringCompany: String(body.hiringCompany || 'PlaneForge').trim(),
  department: String(body.department || '').trim(),
  employmentType: body.employmentType || 'full_time',
  workArrangement: body.workArrangement || 'remote',
  location: String(body.location || '').trim(),
  country: String(body.country || '').trim(),
  locationDescription: String(body.locationDescription || '').trim(),
  remoteEligibility: String(body.remoteEligibility || '').trim(),
  shortDescription: String(body.shortDescription || '').trim(),
  description: String(body.description || '').trim(),
  salaryRange: String(body.salaryRange || '').trim(),
  responsibilities: toTextItems(body.responsibilities),
  requirements: toTextItems(body.requirements),
  preferredQualifications: toTextItems(body.preferredQualifications),
  benefits: toTextItems(body.benefits),
  hiringProcess: Array.isArray(body.hiringProcess) ? body.hiringProcess : [],
  applicationMethod: body.applicationMethod === 'external' ? 'external' : 'internal',
  externalApplyUrl: String(body.externalApplyUrl || '').trim(),
  applicationFields: Array.isArray(body.applicationFields) ? body.applicationFields : [],
  status: body.status || 'draft',
  publishAt: body.publishAt || null,
  applicationDeadline: body.applicationDeadline || null,
  autoClose: body.autoClose !== false,
  closingBehavior: body.closingBehavior || 'keep_closed',
  closedVisibleUntil: body.closedVisibleUntil || null
});

const publishIssues = (body = {}) => {
  const issues = [];
  if (!body.title) issues.push('Add a job title');
  if (!body.hiringCompany) issues.push('Add the hiring company');
  if (!body.shortDescription) issues.push('Add a short description');
  if (!body.description) issues.push('Add the role description');
  if (body.applicationMethod === 'external' && !body.externalApplyUrl) issues.push('Add the external application URL');
  return issues;
};

const publicPosition = (position) => {
  const data = position.toObject ? position.toObject() : position;
  const status = effectiveStatus(data);
  return {
    ...data,
    effectiveStatus: status,
    applicationsOpen: canAcceptApplications(data),
    applicationFields: data.applicationMethod === 'internal' ? data.applicationFields : []
  };
};

export const listPublicCareers = asyncHandler(async (req, res) => {
  const positions = await CareerPosition.find({ status: { $in: ['published', 'closed'] } }).sort({ createdAt: -1 });
  res.json({ positions: positions.filter((position) => isPubliclyVisible(position)).map(publicPosition) });
});

export const getPublicCareer = asyncHandler(async (req, res) => {
  const position = await CareerPosition.findOne({ slug: req.params.slug });
  if (!isPubliclyVisible(position)) {
    throw new ApiError(404, 'Career position not found');
  }
  res.json({ position: publicPosition(position) });
});

export const submitCareerApplication = asyncHandler(async (req, res) => {
  const position = await CareerPosition.findOne({ slug: req.params.slug });
  if (!position) throw new ApiError(404, 'Career position not found');
  if (!canAcceptApplications(position)) {
    throw new ApiError(403, 'Applications are closed for this position');
  }
  if (position.applicationMethod !== 'internal') {
    throw new ApiError(400, 'This position uses an external application link');
  }

  const applicant = req.body.applicant || {};
  const email = String(applicant.email || '').trim().toLowerCase();
  if (!String(applicant.firstName || '').trim() || !String(applicant.lastName || '').trim() || !email) {
    throw new ApiError(400, 'First name, last name, and email are required');
  }

  const documents = (req.body.documents || []).map((document) => {
    const size = Number(document.size || 0);
    if (size > 5 * 1024 * 1024) throw new ApiError(400, 'Uploaded career documents must be 5 MB or smaller');
    if (document.mimeType && !/^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(png|jpeg|webp))$/.test(document.mimeType)) {
      throw new ApiError(400, 'Unsupported career document file type');
    }
    return {
      key: document.key,
      label: document.label,
      fileName: String(document.fileName || 'document').replace(/[^\w.\- ]/g, ''),
      mimeType: document.mimeType,
      size,
      data: document.data
    };
  });

  const application = await CareerApplication.create({
    position: position._id,
    applicant: {
      firstName: String(applicant.firstName || '').trim(),
      lastName: String(applicant.lastName || '').trim(),
      email,
      phone: String(applicant.phone || '').trim(),
      country: String(applicant.country || '').trim(),
      city: String(applicant.city || '').trim()
    },
    professional: req.body.professional || {},
    answers: Array.isArray(req.body.answers) ? req.body.answers : [],
    documents,
    source: 'internal_form',
    statusHistory: [{ from: '', to: 'new', note: 'Application submitted' }]
  });

  res.status(201).json({ message: 'Application submitted successfully.', applicationId: application._id });
});

export const listCareerPositionsAdmin = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit });
  const query = textSearch(search, ['title', 'department', 'hiringCompany', 'location', 'country']);
  if (status) query.status = status;

  const [positions, total] = await Promise.all([
    CareerPosition.find(query).sort({ updatedAt: -1 }).skip(skip).limit(safeLimit),
    CareerPosition.countDocuments(query)
  ]);

  res.json({
    positions: positions.map(publicPosition),
    pagination: { page: currentPage, limit: safeLimit, total, pages: Math.max(Math.ceil(total / safeLimit), 1) }
  });
});

export const createCareerPositionAdmin = asyncHandler(async (req, res) => {
  const body = sanitizePositionInput(req.body);
  if (!positionStatuses.includes(body.status)) throw new ApiError(400, 'Invalid career status');
  const issues = body.status === 'published' ? publishIssues(body) : [];
  if (issues.length) throw new ApiError(400, `Career position is not ready to publish: ${issues.join(', ')}`);
  const position = await CareerPosition.create(body);
  res.status(201).json({ position: publicPosition(position) });
});

export const updateCareerPositionAdmin = asyncHandler(async (req, res) => {
  const body = sanitizePositionInput(req.body);
  if (!positionStatuses.includes(body.status)) throw new ApiError(400, 'Invalid career status');
  const issues = body.status === 'published' ? publishIssues(body) : [];
  if (issues.length) throw new ApiError(400, `Career position is not ready to publish: ${issues.join(', ')}`);
  if (body.status === 'closed') body.closedAt = new Date();
  if (body.status === 'archived') body.archivedAt = new Date();
  const position = await CareerPosition.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!position) throw new ApiError(404, 'Career position not found');
  res.json({ position: publicPosition(position) });
});

export const duplicateCareerPositionAdmin = asyncHandler(async (req, res) => {
  const position = await CareerPosition.findById(req.params.id);
  if (!position) throw new ApiError(404, 'Career position not found');
  const data = position.toObject();
  delete data._id;
  delete data.slug;
  delete data.createdAt;
  delete data.updatedAt;
  data.title = `${data.title} Copy`;
  data.status = 'draft';
  data.closedAt = undefined;
  data.archivedAt = undefined;
  const duplicate = await CareerPosition.create(data);
  res.status(201).json({ position: publicPosition(duplicate) });
});

export const listCareerApplicationsAdmin = asyncHandler(async (req, res) => {
  const { status, position, search, page, limit } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit });
  const query = {};
  if (status) query.status = status;
  if (position) query.position = position;
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ 'applicant.firstName': regex }, { 'applicant.lastName': regex }, { 'applicant.email': regex }];
  }
  const [applications, total] = await Promise.all([
    CareerApplication.find(query).populate('position', 'title slug hiringCompany applicationDeadline').sort({ submittedAt: -1 }).skip(skip).limit(safeLimit),
    CareerApplication.countDocuments(query)
  ]);
  res.json({ applications, pagination: { page: currentPage, limit: safeLimit, total, pages: Math.max(Math.ceil(total / safeLimit), 1) } });
});

export const updateCareerApplicationAdmin = asyncHandler(async (req, res) => {
  const { status, note, internalNote } = req.body;
  if (status && !applicationStatuses.includes(status)) throw new ApiError(400, 'Invalid application status');
  const application = await CareerApplication.findById(req.params.id).populate('position', 'title slug hiringCompany applicationDeadline');
  if (!application) throw new ApiError(404, 'Career application not found');
  if (status && status !== application.status) {
    application.statusHistory.push({ from: application.status, to: status, note, changedBy: req.user._id });
    application.status = status;
  }
  if (internalNote) application.internalNotes.push({ note: String(internalNote).trim(), createdBy: req.user._id });
  await application.save();
  res.json({ application });
});

export const getCareerDocumentAdmin = asyncHandler(async (req, res) => {
  const application = await CareerApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Career application not found');
  const document = application.documents.id(req.params.documentId);
  if (!document?.data) throw new ApiError(404, 'Career document not found');
  res.json({ document });
});
