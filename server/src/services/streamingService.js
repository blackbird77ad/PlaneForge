import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const normalizePem = (value) => value?.replace(/\\n/g, '\n');

const muxAuthHeader = () => {
  if (!env.streaming.mux.tokenId || !env.streaming.mux.tokenSecret) {
    throw new ApiError(503, 'Mux credentials are not configured');
  }

  return `Basic ${Buffer.from(`${env.streaming.mux.tokenId}:${env.streaming.mux.tokenSecret}`).toString('base64')}`;
};

const muxRequest = async (path, options = {}) => {
  const response = await fetch(`https://api.mux.com/video/v1${path}`, {
    ...options,
    headers: {
      Authorization: muxAuthHeader(),
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error?.message || data.message || 'Mux request failed');
  }

  return data.data || data;
};

export const createPlaybackGrant = ({ course, lesson, user, session }) => {
  const stream = lesson.stream || {};
  const provider = stream.provider || env.streaming.provider;
  const playbackId = stream.playbackId || stream.assetId;

  if (!playbackId || stream.status !== 'ready') {
    return {
      provider,
      status: stream.status || 'not_uploaded',
      configured: false,
      message: 'This lesson stream is not ready yet.'
    };
  }

  if (provider === 'mux') {
    return {
      provider: 'mux',
      status: stream.status,
      configured: true,
      playbackId,
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      dataEnvironmentKey: env.streaming.mux.dataEnvironmentKey
    };
  }

  if (provider !== 'cloudflare') {
    return {
      provider,
      status: stream.status,
      configured: false,
      message: 'Playback signing for this provider is not configured yet.'
    };
  }

  const signingKey = normalizePem(env.streaming.cloudflare.signingKeyPem);
  if (!signingKey || !env.streaming.cloudflare.signingKeyId) {
    throw new ApiError(503, 'Cloudflare Stream signed playback is not configured');
  }

  const expiresIn = env.streaming.tokenTtlSeconds;
  const token = jwt.sign(
    {
      sub: playbackId,
      courseId: course._id.toString(),
      lessonId: lesson._id.toString(),
      userId: user._id.toString(),
      sessionId: session?._id?.toString()
    },
    signingKey,
    {
      algorithm: 'RS256',
      expiresIn,
      header: {
        kid: env.streaming.cloudflare.signingKeyId
      }
    }
  );

  const base = env.streaming.cloudflare.customerSubdomain
    ? `https://${env.streaming.cloudflare.customerSubdomain}.cloudflarestream.com`
    : 'https://customer.cloudflarestream.com';

  return {
    provider: 'cloudflare',
    status: stream.status,
    configured: true,
    expiresIn,
    token,
    playbackUrl: `${base}/${token}/manifest/video.m3u8`
  };
};

export const createDirectUploadIntent = async ({ course, lesson }) => {
  const provider = lesson.stream?.provider || env.streaming.provider;

  if (provider !== 'mux') {
    return {
      provider,
      courseId: course._id,
      lessonId: lesson._id,
      directUploadUrl: null,
      message: 'Set this lesson provider to Mux before creating an upload URL.'
    };
  }

  const upload = await muxRequest('/uploads', {
    method: 'POST',
    body: JSON.stringify({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        passthrough: JSON.stringify({
          courseId: course._id.toString(),
          lessonId: lesson._id.toString()
        })
      }
    })
  });

  lesson.stream = {
    ...(lesson.stream || {}),
    provider: 'mux',
    uploadId: upload.id,
    status: 'uploading',
    signedPlaybackRequired: false
  };
  await course.save();

  return {
    provider: 'mux',
    courseId: course._id,
    lessonId: lesson._id,
    uploadId: upload.id,
    directUploadUrl: upload.url,
    status: 'uploading',
    message: 'Mux upload URL created. Choose a video file to upload directly to Mux.'
  };
};

export const refreshMuxLessonStream = async ({ course, lesson }) => {
  const uploadId = lesson.stream?.uploadId;
  if (!uploadId) {
    throw new ApiError(400, 'This lesson does not have a Mux upload id yet');
  }

  const upload = await muxRequest(`/uploads/${uploadId}`);
  const updates = {
    ...(lesson.stream || {}),
    provider: 'mux',
    uploadId,
    status: upload.asset_id ? 'processing' : lesson.stream?.status || 'uploading'
  };

  if (upload.asset_id) {
    const asset = await muxRequest(`/assets/${upload.asset_id}`);
    updates.assetId = asset.id;
    updates.playbackId = asset.playback_ids?.[0]?.id || lesson.stream?.playbackId;
    updates.status = asset.status === 'ready' ? 'ready' : asset.status === 'errored' ? 'failed' : 'processing';
  }

  lesson.stream = updates;
  await course.save();

  return {
    provider: 'mux',
    courseId: course._id,
    lessonId: lesson._id,
    uploadId,
    assetId: updates.assetId,
    playbackId: updates.playbackId,
    status: updates.status,
    message:
      updates.status === 'ready'
        ? 'Mux asset is ready for learner playback.'
        : 'Mux is still processing this lesson.'
  };
};
