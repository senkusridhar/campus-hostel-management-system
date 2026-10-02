'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MaintenanceTicketRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/complaints/${id}`);
    }
  }, [id, router]);

  return <div className="p-8 text-center text-xs text-slate-500">Redirecting to work order details...</div>;
}
