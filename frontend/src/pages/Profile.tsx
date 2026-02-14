import { useState, useEffect } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Trash2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/shared/Button';
import { ProfileImageUploader } from '@/components/shared/ProfileImageUploader';
import { useUserStore } from '@/store/useUserStore';

type Tab = 'personal' | 'email' | 'password';

interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  role: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, setUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User data
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Personal info form
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Email form
  const [emailForm, setEmailForm] = useState({
    email: '',
    currentPassword: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account form
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<{ user: UserProfile }>('/user/profile');
      setProfile(data.user);
      setUser(data.user);
      setPersonalForm({
        name: data.user.name || '',
        phone: data.user.phone || '',
        address: data.user.address || '',
      });
      setEmailForm({
        email: data.user.email,
        currentPassword: '',
      });
    } catch (error) {
      showMessage('error', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await apiClient.put<{ user: UserProfile; message: string }>('/user/profile/details', personalForm);
      setProfile(data.user);
      setUser(data.user);
      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      showMessage('error', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await apiClient.put<{ user: UserProfile; message: string }>('/user/profile/email', emailForm);
      setProfile(data.user);
      setUser(data.user);
      setEmailForm({ email: data.user.email, currentPassword: '' });
      showMessage('success', 'Email updated successfully');
    } catch (error) {
      showMessage('error', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put('/user/profile/password', passwordForm);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showMessage('success', 'Password updated successfully');
    } catch (error) {
      showMessage('error', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmDelete) {
      showMessage('error', 'Please confirm account deletion');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.delete('/user/profile', {
        data: { password: deletePassword },
      });
      logout();
      navigate('/');
    } catch (error) {
      showMessage('error', getApiErrorMessage(error));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="lux-container flex min-h-[60vh] items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'password', label: 'Password', icon: Lock },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-(--color-background)">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-16 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="lux-container relative">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">Account</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Profile <span className="text-gradient-red">Settings</span></h1>
            <p className="mt-2 text-white/60">Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="lux-container py-8">
        <div className="mx-auto max-w-4xl">

          {/* Message Banner */}
          {message && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
                }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8 flex gap-2 overflow-x-auto border-b border-black/4 pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id
                      ? 'border-red-200 text-(--color-red)'
                      : 'border-transparent text-(--color-muted) hover:text-(--color-text)'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl border border-black/4 bg-white p-6 shadow-sm">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <form onSubmit={handleUpdatePersonal} className="space-y-6">
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Personal Information</h2>
                  <p className="mb-6 text-sm text-(--color-muted)">
                    Update your personal details and contact information
                  </p>
                </div>

                {/* Profile Image Upload */}
                <div>
                  <label className="mb-3 block text-sm font-semibold">Profile Picture</label>
                  <ProfileImageUploader
                    currentImage={profile?.profileImage}
                    userName={profile?.name}
                    onImageUpdate={(imageUrl) => {
                      if (profile) {
                        const updatedProfile = { ...profile, profileImage: imageUrl };
                        setProfile(updatedProfile);
                        setUser(updatedProfile);
                      }
                    }}
                  />
                </div>

                <div className="border-t border-black/4 pt-6">
                  <h3 className="mb-4 text-lg font-semibold">Personal Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={personalForm.name}
                        onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                        className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={personalForm.phone}
                        onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="mb-2 block text-sm font-semibold">
                        Address
                      </label>
                      <textarea
                        id="address"
                        value={personalForm.address}
                        onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                        placeholder="Enter your full address"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>

                {/* Delete Account Section */}
                <div className="mt-8 border-t border-black/4 pt-6">
                  <h3 className="mb-2 text-lg font-semibold text-red-600">Delete Account</h3>
                  <p className="mb-4 text-sm text-(--color-muted)">
                    Permanently delete your account and all associated data including orders and tickets.
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    className="inline-flex items-center gap-2"
                    onClick={() => setActiveTab('deleteConfirm' as Tab)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </form>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <form onSubmit={handleUpdateEmail} className="space-y-6">
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Change Email</h2>
                  <p className="mb-6 text-sm text-(--color-muted)">
                    Update your email address. You'll need to verify your current password.
                  </p>
                </div>

                <div>
                  <label htmlFor="current-email" className="mb-2 block text-sm font-semibold">
                    Current Email
                  </label>
                  <input
                    type="email"
                    id="current-email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full rounded-xl border border-black/4 bg-gray-50 px-4 py-3 text-sm text-(--color-muted)"
                  />
                </div>

                <div>
                  <label htmlFor="new-email" className="mb-2 block text-sm font-semibold">
                    New Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="new-email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                    placeholder="Enter new email address"
                  />
                </div>

                <div>
                  <label htmlFor="email-password" className="mb-2 block text-sm font-semibold">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="email-password"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                    required
                    className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                    placeholder="Enter your current password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Email
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <h2 className="mb-4 text-2xl font-bold">Change Password</h2>
                  <p className="mb-6 text-sm text-(--color-muted)">
                    Update your password to keep your account secure
                  </p>
                </div>

                <div>
                  <label htmlFor="current-password" className="mb-2 block text-sm font-semibold">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-semibold">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <p className="mt-1 text-xs text-(--color-muted)">
                    Must include uppercase, lowercase, and number
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Delete Account Confirmation */}
            {(activeTab as string) === 'deleteConfirm' && (
              <form onSubmit={handleDeleteAccount} className="space-y-6">
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-red-600">Delete Account</h2>
                  <p className="mb-6 text-sm text-(--color-muted)">
                    Permanently delete your account and all associated data
                  </p>
                </div>

                <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <div className="mb-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <h3 className="mb-2 font-semibold text-red-800">
                        This action cannot be undone
                      </h3>
                      <p className="text-sm text-red-700">
                        Deleting your account will permanently remove all your data, including orders,
                        tickets, and profile information. This action is irreversible.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="delete-password" className="mb-2 block text-sm font-semibold">
                    Enter Password to Confirm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="delete-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-black/4 bg-white px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirm-delete"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="h-4 w-4 rounded border-black/4 text-red-600 focus:ring-2 focus:ring-red-500/20"
                  />
                  <label htmlFor="confirm-delete" className="text-sm font-medium">
                    I understand that this action is permanent and cannot be undone
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('personal')}
                    className="inline-flex items-center gap-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !confirmDelete}
                    variant="danger"
                    className="inline-flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
        </div>
      </div>
    </PageTransition>
  );
}
