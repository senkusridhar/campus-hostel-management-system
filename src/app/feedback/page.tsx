'use client';

import React, { useEffect, useState } from 'react';
import MonthlyFeedbackPage from './monthly/page';
import FeedbackAnalyticsPage from './analytics/page';
import { LoadingState } from '@/components/ui/StateFeedback';

export default function FeedbackPortalPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setRole(data.user.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="Loading Resident Feedback Portal..." />;
  }

  // Admins and Wardens view aggregated analytics by default; Students submit monthly feedback
  if (role === 'SUPER_ADMIN' || role === 'WARDEN') {
    return <FeedbackAnalyticsPage />;
  }

  return <MonthlyFeedbackPage />;
}
