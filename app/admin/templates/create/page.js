import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import CreateTemplateForm from './CreateTemplateForm';

export const metadata = {
  title: 'Tambah Template Baru | Admin Panel',
};

export default async function CreateTemplatePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'super-admin') redirect('/admin/templates');

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tambah Template Baru</h1>
          <p className="text-sm text-gray-500 mt-1">
            Unggah bundle kode dan daftarkan template website baru.
          </p>
        </div>
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form — 3/4 width */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Formulir Template Baru</h2>
              <p className="text-xs text-gray-500 mt-0.5">Isi semua kolom yang diperlukan untuk mendaftarkan template.</p>
            </div>
            <div className="p-6">
              <CreateTemplateForm />
            </div>
          </div>
        </div>

        {/* Sidebar — 1/4 width */}
        <div className="lg:col-span-1 space-y-4">
          {/* Panduan Bundle Zip */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Panduan Bundle Zip</h3>
            </div>
            <div className="p-5">
              <ol className="space-y-3">
                {[
                  'Pastikan berkas .zip memuat struktur folder komponen utama.',
                  'Sertakan berkas manifest atau config.json di root folder zip.',
                  'Gunakan penamaan slug yang unik dan belum pernah dipakai.',
                  'Ukuran berkas zip maksimal 50 MB per unggahan.',
                  'Preview image disarankan berukuran 1280×720 px (rasio 16:9).',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Catatan Status */}
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Catatan Status</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Template dengan status <span className="font-medium">Tidak Aktif</span> tidak akan muncul sebagai pilihan saat membuat website baru.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
