import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewBookingModal } from "../components/appointments/NewBookingModal";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function BookingPage() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => setOpen(true), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">New booking</h1>
        <p className="mt-1 text-sm text-slate-500">Create a frontend-only mock appointment booking.</p>
      </div>
      <Card className="p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-950">Booking form</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Use the professional booking modal to capture patient, branch, dentist, service, payment, and notes.</p>
        <Button className="mt-5" onClick={() => setOpen(true)}>Open booking form</Button>
      </Card>
      <NewBookingModal open={open} onClose={() => { setOpen(false); if (window.location.pathname === "/booking") navigate("/calendar"); }} />
    </div>
  );
}
