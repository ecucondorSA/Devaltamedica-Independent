import { useState, useCallback } from 'react';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  posted: Date;
  applications: number;
}

export function useJobPostingLogic() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Emergency Room Physician',
      department: 'Emergency',
      location: 'Hospital Central',
      type: 'full-time',
      urgency: 'critical',
      posted: new Date(),
      applications: 3,
    },
    {
      id: '2',
      title: 'ICU Nurse',
      department: 'Intensive Care',
      location: 'Hospital Norte',
      type: 'full-time',
      urgency: 'high',
      posted: new Date(),
      applications: 7,
    },
  ]);

  const createJobPosting = useCallback((data: Partial<JobPosting>) => {
    const newJob: JobPosting = {
      id: Date.now().toString(),
      title: data.title || 'New Position',
      department: data.department || 'General',
      location: data.location || 'Main Hospital',
      type: data.type || 'full-time',
      urgency: data.urgency || 'medium',
      posted: new Date(),
      applications: 0,
    };

    setJobPostings((prev) => [...prev, newJob]);
    return newJob;
  }, []);

  const updateJobApplications = useCallback((id: string) => {
    setJobPostings((prev) =>
      prev.map((job) => (job.id === id ? { ...job, applications: job.applications + 1 } : job)),
    );
  }, []);

  const removeJobPosting = useCallback((id: string) => {
    setJobPostings((prev) => prev.filter((job) => job.id !== id));
  }, []);

  return {
    jobPostings,
    createJobPosting,
    updateJobApplications,
    removeJobPosting,
    totalJobPostings: jobPostings.length,
    criticalPostings: jobPostings.filter((j) => j.urgency === 'critical').length,
  };
}
