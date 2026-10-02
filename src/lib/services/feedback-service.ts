import { MonthlyFeedbackRecord, FeedbackAnalyticsData } from '@/types';
import { listComplaints } from './complaint-service';

export interface SubmitMonthlyFeedbackInput {
  studentId: string;
  studentName?: string;
  hostelId?: string;
  hostelName?: string;
  month: number;
  year: number;
  generalComment?: string;
  isAnonymous?: boolean;
  ratings: {
    category: string;
    criterion: string;
    rating: number;
  }[];
}

// Memory store for monthly feedback submissions
const memoryFeedbacks: MonthlyFeedbackRecord[] = [
  {
    id: 'fb-2026-09-01',
    studentId: 'demo-student-02',
    studentName: 'Vikram Singh',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    month: 9,
    year: 2026,
    generalComment: 'Mess breakfast quality has improved. Night study hall air conditioning needs filter cleaning.',
    isAnonymous: false,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    ratings: [
      { category: 'FOOD', criterion: 'Food Quality', rating: 4 },
      { category: 'FOOD', criterion: 'Food Taste', rating: 4 },
      { category: 'FOOD', criterion: 'Mess Hygiene', rating: 4 },
      { category: 'STAFF', criterion: 'Staff Behaviour', rating: 5 },
      { category: 'CLEANLINESS', criterion: 'Hostel Cleanliness', rating: 4 },
      { category: 'SECURITY', criterion: 'Security', rating: 5 },
      { category: 'MAINTENANCE', criterion: 'Maintenance', rating: 4 },
      { category: 'EXPERIENCE', criterion: 'Overall Hostel Experience', rating: 4 },
      { category: 'STAFF', criterion: 'Staff Responsiveness', rating: 4 },
      { category: 'STAFF', criterion: 'Staff Helpfulness', rating: 5 },
      { category: 'STAFF', criterion: 'Staff Professionalism', rating: 5 },
    ],
  },
  {
    id: 'fb-2026-09-02',
    studentId: 'demo-student-03',
    studentName: 'Amit Sharma',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    month: 9,
    year: 2026,
    generalComment: 'Wi-Fi connectivity in block B needs higher bandwidth during evening hours.',
    isAnonymous: true,
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    ratings: [
      { category: 'FOOD', criterion: 'Food Quality', rating: 4 },
      { category: 'FOOD', criterion: 'Food Taste', rating: 3 },
      { category: 'FOOD', criterion: 'Mess Hygiene', rating: 5 },
      { category: 'STAFF', criterion: 'Staff Behaviour', rating: 4 },
      { category: 'CLEANLINESS', criterion: 'Hostel Cleanliness', rating: 4 },
      { category: 'SECURITY', criterion: 'Security', rating: 4 },
      { category: 'MAINTENANCE', criterion: 'Maintenance', rating: 3 },
      { category: 'EXPERIENCE', criterion: 'Overall Hostel Experience', rating: 4 },
      { category: 'STAFF', criterion: 'Staff Responsiveness', rating: 4 },
      { category: 'STAFF', criterion: 'Staff Helpfulness', rating: 4 },
      { category: 'STAFF', criterion: 'Staff Professionalism', rating: 4 },
    ],
  },
  {
    id: 'fb-2026-10-01',
    studentId: 'demo-student-04',
    studentName: 'Priya Sharma',
    hostelId: 'hostel-gha',
    hostelName: 'Girls Hostel A',
    month: 10,
    year: 2026,
    generalComment: 'Cleanliness in common corridors is very well maintained by housekeeping staff.',
    isAnonymous: true,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    ratings: [
      { category: 'FOOD', criterion: 'Food Quality', rating: 5 },
      { category: 'FOOD', criterion: 'Food Taste', rating: 4 },
      { category: 'FOOD', criterion: 'Mess Hygiene', rating: 5 },
      { category: 'STAFF', criterion: 'Staff Behaviour', rating: 5 },
      { category: 'CLEANLINESS', criterion: 'Hostel Cleanliness', rating: 5 },
      { category: 'SECURITY', criterion: 'Security', rating: 5 },
      { category: 'MAINTENANCE', criterion: 'Maintenance', rating: 4 },
      { category: 'EXPERIENCE', criterion: 'Overall Hostel Experience', rating: 5 },
      { category: 'STAFF', criterion: 'Staff Responsiveness', rating: 5 },
      { category: 'STAFF', criterion: 'Staff Helpfulness', rating: 5 },
      { category: 'STAFF', criterion: 'Staff Professionalism', rating: 5 },
    ],
  },
];

/**
 * Submit monthly feedback (1 submission per student per month/year)
 */
export async function submitMonthlyFeedback(input: SubmitMonthlyFeedbackInput) {
  const month = Number(input.month);
  const year = Number(input.year);

  if (isNaN(month) || month < 1 || month > 12) {
    return { error: 'Month must be between 1 and 12.' };
  }

  if (isNaN(year) || year < 2020 || year > 2100) {
    return { error: 'Year is invalid.' };
  }

  // Check duplicate submission
  const existing = memoryFeedbacks.find(
    (f) => f.studentId === input.studentId && f.month === month && f.year === year
  );

  if (existing) {
    return {
      error: `You have already submitted monthly feedback for ${month}/${year}. Only one submission is permitted per month.`,
    };
  }

  if (!input.ratings || !Array.isArray(input.ratings) || input.ratings.length === 0) {
    return { error: 'Feedback ratings are required.' };
  }

  // Validate all ratings are 1-5
  for (const r of input.ratings) {
    const val = Number(r.rating);
    if (isNaN(val) || val < 1 || val > 5) {
      return { error: `Rating for "${r.criterion}" must be an integer between 1 and 5 stars.` };
    }
  }

  const newRecord: MonthlyFeedbackRecord = {
    id: `fb-${year}-${String(month).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
    studentId: input.studentId,
    studentName: input.studentName || 'Demo Student',
    hostelId: input.hostelId || 'hostel-bha',
    hostelName: input.hostelName || 'Boys Hostel A',
    month,
    year,
    generalComment: input.generalComment?.trim(),
    isAnonymous: Boolean(input.isAnonymous),
    createdAt: new Date().toISOString(),
    ratings: input.ratings.map((r) => ({
      category: r.category,
      criterion: r.criterion,
      rating: Math.round(Number(r.rating)),
    })),
  };

  memoryFeedbacks.unshift(newRecord);
  const avgRating =
    newRecord.ratings.length > 0
      ? Number((newRecord.ratings.reduce((sum, r) => sum + r.rating, 0) / newRecord.ratings.length).toFixed(2))
      : 4.0;

  return { success: true, feedback: { ...newRecord, averageRating: avgRating } };
}

/**
 * Get monthly feedbacks list
 */
export async function getMonthlyFeedbacks(params: {
  studentId?: string;
  role?: string;
  month?: number;
  year?: number;
  hostelId?: string;
}) {
  let list = [...memoryFeedbacks];

  if (params.studentId && params.role === 'STUDENT') {
    list = list.filter((f) => f.studentId === params.studentId);
  }

  if (params.month) {
    list = list.filter((f) => f.month === Number(params.month));
  }

  if (params.year) {
    list = list.filter((f) => f.year === Number(params.year));
  }

  if (params.hostelId && params.hostelId !== 'All') {
    list = list.filter((f) => f.hostelId === params.hostelId);
  }

  return list.map((f) => ({
    id: f.id,
    studentId: f.studentId,
    studentName: f.isAnonymous ? 'Anonymous Student' : f.studentName,
    hostelId: f.hostelId,
    hostelName: f.hostelName,
    month: f.month,
    year: f.year,
    generalComment: f.generalComment,
    isAnonymous: f.isAnonymous,
    createdAt: f.createdAt,
    ratings: f.ratings,
  }));
}

/**
 * Compute monthly feedback analytics for Admin & Warden
 */
export async function getMonthlyFeedbackAnalytics(params: {
  month?: number;
  year?: number;
  hostelId?: string;
} = {}): Promise<FeedbackAnalyticsData> {
  const currentMonth = params.month ? Number(params.month) : 10;
  const currentYear = params.year ? Number(params.year) : 2026;

  let feedbacks = memoryFeedbacks.filter(
    (f) => f.month === currentMonth && f.year === currentYear
  );

  if (params.hostelId && params.hostelId !== 'All') {
    feedbacks = feedbacks.filter((f) => f.hostelId === params.hostelId);
  }

  // If filtered month has fewer items, include broader dataset to compute meaningful distributions
  const allHostelFeedbacks =
    feedbacks.length > 0
      ? feedbacks
      : memoryFeedbacks.filter((f) => f.year === currentYear);

  const categoryTotals: Record<string, { sum: number; count: number }> = {
    'Food Quality': { sum: 0, count: 0 },
    'Food Taste': { sum: 0, count: 0 },
    'Mess Hygiene': { sum: 0, count: 0 },
    'Staff Behaviour': { sum: 0, count: 0 },
    'Hostel Cleanliness': { sum: 0, count: 0 },
    'Security': { sum: 0, count: 0 },
    'Maintenance': { sum: 0, count: 0 },
    'Overall Hostel Experience': { sum: 0, count: 0 },
  };

  const staffTotals: Record<string, { sum: number; count: number }> = {
    'Behaviour': { sum: 0, count: 0 },
    'Responsiveness': { sum: 0, count: 0 },
    'Helpfulness': { sum: 0, count: 0 },
    'Professionalism': { sum: 0, count: 0 },
  };

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let allRatingsSum = 0;
  let allRatingsCount = 0;

  for (const f of allHostelFeedbacks) {
    for (const r of f.ratings) {
      const score = r.rating;
      if (distribution[score] !== undefined) {
        distribution[score]++;
      }
      allRatingsSum += score;
      allRatingsCount++;

      // Map criteria
      if (categoryTotals[r.criterion]) {
        categoryTotals[r.criterion].sum += score;
        categoryTotals[r.criterion].count++;
      } else {
        // Staff categories or aliases
        if (r.criterion.includes('Behaviour') && staffTotals['Behaviour']) {
          staffTotals['Behaviour'].sum += score;
          staffTotals['Behaviour'].count++;
        }
        if (r.criterion.includes('Responsiveness') && staffTotals['Responsiveness']) {
          staffTotals['Responsiveness'].sum += score;
          staffTotals['Responsiveness'].count++;
        }
        if (r.criterion.includes('Helpfulness') && staffTotals['Helpfulness']) {
          staffTotals['Helpfulness'].sum += score;
          staffTotals['Helpfulness'].count++;
        }
        if (r.criterion.includes('Professionalism') && staffTotals['Professionalism']) {
          staffTotals['Professionalism'].sum += score;
          staffTotals['Professionalism'].count++;
        }
      }
    }
  }

  const categoryAverages: Record<string, number> = {};
  for (const [key, val] of Object.entries(categoryTotals)) {
    categoryAverages[key] = val.count > 0 ? Number((val.sum / val.count).toFixed(1)) : 4.0;
  }

  const staffAverages: Record<string, number> = {};
  for (const [key, val] of Object.entries(staffTotals)) {
    staffAverages[key] = val.count > 0 ? Number((val.sum / val.count).toFixed(1)) : 4.5;
  }

  const overallAverage =
    allRatingsCount > 0 ? Number((allRatingsSum / allRatingsCount).toFixed(1)) : 4.2;

  const recentComments = allHostelFeedbacks
    .filter((f) => Boolean(f.generalComment))
    .map((f) => {
      const avg =
        f.ratings.length > 0
          ? Number((f.ratings.reduce((acc, r) => acc + r.rating, 0) / f.ratings.length).toFixed(1))
          : 4.0;
      return {
        id: f.id,
        comment: f.generalComment!,
        isAnonymous: f.isAnonymous,
        studentName: f.isAnonymous ? 'Anonymous Resident' : f.studentName,
        createdAt: f.createdAt,
        overallScore: avg,
      };
    });

  const complaints = await listComplaints({});
  let totalUpvotes = 0;
  let totalDownvotes = 0;
  let ratedCount = 0;
  let ratingSum = 0;

  for (const c of complaints) {
    totalUpvotes += c.upvotesCount || 0;
    totalDownvotes += c.downvotesCount || 0;
    if (c.rating && c.rating.score) {
      ratedCount++;
      ratingSum += c.rating.score;
    }
  }

  const averageComplaintRating = ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(1)) : 4.5;

  return {
    month: currentMonth,
    year: currentYear,
    totalResponses: allHostelFeedbacks.length,
    totalSubmissions: allHostelFeedbacks.length,
    categoryAverages,
    overallAverage,
    averageOverall: overallAverage,
    ratingDistribution: distribution,
    staffAverages,
    complaintMetrics: {
      averageRating: averageComplaintRating,
      totalRatings: ratedCount,
      totalUpvotes,
      totalDownvotes,
      totalComplaints: complaints.length,
    },
    recentComments,
  };
}
