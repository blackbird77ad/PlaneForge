import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const CheckoutComplete = () => (
  <main className="section page">
    <div className="locked-learning">
      <ShieldCheck size={30} />
      <h1>Payment verification is in progress</h1>
      <p>Course access unlocks after the payment provider confirms the transaction.</p>
      <div className="under-dev-actions">
        <Link className="button primary" to="/dashboard/student">
          View dashboard
        </Link>
        <Link className="button ghost" to="/courses">
          Browse courses
        </Link>
      </div>
    </div>
  </main>
);
