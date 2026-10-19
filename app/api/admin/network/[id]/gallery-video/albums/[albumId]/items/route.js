import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Unggah berkas video sudah tidak digunakan. Tambahkan tautan YouTube dari pengelolaan album.' },
    { status: 410 }
  )
}
