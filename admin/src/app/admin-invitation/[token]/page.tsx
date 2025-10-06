import AcceptInvitationClient from './AcceptInvitationClient';

interface PageProps {
  params: { token: string };
}

export default function AcceptInvitationPage({ params }: PageProps) {
  return <AcceptInvitationClient token={params.token} />;
}
