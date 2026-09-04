import { useAuth } from '@/context/AuthContext';
import ClientRegistrationDialog from '@/components/ClientRegistrationDialog';

interface ClientFormProps {
  onClose: () => void;
}

export default function ClientForm({ onClose }: ClientFormProps) {
  const { addClient } = useAuth();

  return <ClientRegistrationDialog onClose={onClose} onSave={addClient} />;
}
