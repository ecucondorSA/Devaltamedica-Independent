"use client";

// Deprecated: do not import. Kept only as a no-op stub during pruning.
import React from "react";

import { logger } from '@altamedica/shared';
export interface VideoConsultationDoctorProps {
  roomId?: string;
}

const VideoConsultationDoctor: React.FC<VideoConsultationDoctorProps> = () => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    logger.warn(
      "VideoConsultationDoctor is deprecated and stubbed. Use DoctorVideoCall instead."
    );
  }
  return null;
};

export default VideoConsultationDoctor;