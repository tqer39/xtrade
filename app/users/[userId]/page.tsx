import { UserProfileClient } from './_components/user-profile-client';

type Params = Promise<{ userId: string }>;

export default async function UserProfilePage({ params }: { params: Params }) {
  const { userId } = await params;
  return <UserProfileClient userId={userId} />;
}
