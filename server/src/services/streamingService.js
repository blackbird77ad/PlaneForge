import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const normalizePem = (value) => value?.replace(/\\n/g, '\n');

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

export const createDirectUploadIntent = async ({ course, lesson }) => ({
  provider: env.streaming.provider,
  courseId: course._id,
  lessonId: lesson._id,
  directUploadUrl: null,
  message:
    'Configure Cloudflare Stream API credentials to generate direct-upload URLs. The app server must not receive large lesson videos.'
});
