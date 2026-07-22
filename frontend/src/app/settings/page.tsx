'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-heading-2 text-neutral-dark">Settings</h1>
          <p className="text-body text-neutral mt-1">Manage your account settings</p>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-body font-semibold text-neutral-dark mb-4">Profile</h3>
            <div className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="text-body font-semibold text-neutral-dark mb-4">Danger Zone</h3>
            <p className="text-body text-neutral mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="secondary" className="text-danger border-danger hover:bg-danger/10">
              Delete Account
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
