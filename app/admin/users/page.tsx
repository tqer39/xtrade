'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';

interface AllowedUser {
  id: string;
  twitterUsername: string;
  addedBy: string;
  createdAt: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  twitterUsername: string | null;
  role: string;
}

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  twitterUsername: string | null;
  role: string;
  trustScore: number | null;
  trustGrade: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // ユーザー情報を取得
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/admin/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserData(data.user);
          }
        })
        .catch(console.error);
    }
  }, [session?.user?.id]);

  const fetchAllowedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/allowed-users');
      if (!res.ok) {
        if (res.status === 403) {
          setError('管理者権限が必要です');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setAllowedUsers(data.allowedUsers);
      setError(null);
    } catch {
      setError('ホワイトリストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRegisteredUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        if (res.status === 403) {
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setRegisteredUsers(data.users);
    } catch {
      // エラーは既にホワイトリストで表示される可能性があるため、ここでは設定しない
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ホワイトリスト・登録ユーザー取得
  useEffect(() => {
    if (!isPending && session?.user) {
      fetchAllowedUsers();
      fetchRegisteredUsers();
    }
  }, [isPending, session, fetchAllowedUsers, fetchRegisteredUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/allowed-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitterUsername: newUsername }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add user');
      }

      setNewUsername('');
      await fetchAllowedUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`@${username} をホワイトリストから削除しますか？`)) return;

    try {
      const res = await fetch(`/api/admin/allowed-users?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      await fetchAllowedUsers();
    } catch {
      setError('削除に失敗しました');
    }
  };

  if (isPending) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>管理画面</h1>
          <p style={styles.error}>ログインが必要です</p>
          <button type="button" onClick={() => router.push('/')} style={styles.button}>
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  // admin ロールチェック（userData から取得）
  if (userData && userData.role !== 'admin') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>アクセス拒否</h1>
          <p style={styles.error}>管理者権限が必要です</p>
          <button type="button" onClick={() => router.push('/')} style={styles.button}>
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>ユーザー管理</h1>
          <button type="button" onClick={() => router.push('/')} style={styles.backButton}>
            戻る
          </button>
        </div>

        {/* 新規ユーザー追加フォーム */}
        <div style={styles.section}>
          <h2 style={styles.subtitle}>ホワイトリストに追加</h2>
          <form onSubmit={handleAdd} style={styles.form}>
            <div style={styles.inputGroup}>
              <span style={styles.inputPrefix}>@</span>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="username"
                style={styles.input}
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={submitting || !newUsername.trim()}
            >
              {submitting ? '追加中...' : '追加'}
            </button>
          </form>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* ホワイトリスト一覧 */}
        <div style={styles.section}>
          <h2 style={styles.subtitle}>ホワイトリスト ({allowedUsers.length})</h2>
          {loading ? (
            <div style={styles.loading}>読み込み中...</div>
          ) : allowedUsers.length === 0 ? (
            <p style={styles.empty}>ホワイトリストは空です</p>
          ) : (
            <ul style={styles.list}>
              {allowedUsers.map((user) => (
                <li key={user.id} style={styles.listItem}>
                  <span style={styles.username}>@{user.twitterUsername}</span>
                  <span style={styles.date}>
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id, user.twitterUsername)}
                    style={styles.deleteButton}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 登録済みユーザー一覧 */}
        <div style={styles.section}>
          <h2 style={styles.subtitle}>登録済みユーザー ({registeredUsers.length})</h2>
          {usersLoading ? (
            <div style={styles.loading}>読み込み中...</div>
          ) : registeredUsers.length === 0 ? (
            <p style={styles.empty}>登録済みユーザーはいません</p>
          ) : (
            <ul style={styles.list}>
              {registeredUsers.map((user) => (
                <li key={user.id} style={styles.userListItem}>
                  <div style={styles.userInfo}>
                    {user.image && <img src={user.image} alt={user.name} style={styles.avatar} />}
                    <div style={styles.userDetails}>
                      <span style={styles.userName}>{user.name}</span>
                      {user.twitterUsername && (
                        <span style={styles.userHandle}>@{user.twitterUsername}</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.userMeta}>
                    {user.trustGrade && <span style={styles.trustBadge}>{user.trustGrade}</span>}
                    <span style={styles.roleBadge} data-role={user.role}>
                      {user.role}
                    </span>
                    <span style={styles.date}>
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: '#f5f5f5',
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  section: {
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    gap: '8px',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  inputPrefix: {
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #eee',
    gap: '12px',
  },
  username: {
    flex: 1,
    fontWeight: '500',
  },
  date: {
    color: '#666',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    color: '#e53e3e',
    border: '1px solid #e53e3e',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  loading: {
    textAlign: 'center',
    padding: '24px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '24px',
    color: '#999',
  },
  error: {
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: '16px',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#e53e3e',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  userListItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    borderBottom: '1px solid #eee',
    gap: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  userName: {
    fontWeight: '500',
    fontSize: '14px',
  },
  userHandle: {
    color: '#666',
    fontSize: '12px',
  },
  userMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  trustBadge: {
    padding: '2px 8px',
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  roleBadge: {
    padding: '2px 8px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    borderRadius: '4px',
    fontSize: '12px',
  },
};
