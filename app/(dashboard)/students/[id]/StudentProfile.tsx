'use client';

import { useState } from 'react';
import { Image, ImageKitProvider } from '@imagekit/next';

type Student = {
  id: string;
  name: string;
  motherName?: string | null;
  motherPhone?: string | null;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  imagePath?: string | null;
  fee?: number | string | null;
  parent?: { id: string; username: string; name?: string | null } | null;
};

function StudentProfileInner({ student }: { student: Student }) {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  const [imageError, setImageError] = useState(false);
  const showImage = student.imagePath && urlEndpoint && !imageError;

  return (
    <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
      {showImage ? (
        <Image
          src={(student.imagePath ?? '').startsWith('/') ? (student.imagePath ?? '') : `/${student.imagePath ?? ''}`}
          width={120}
          height={120}
          transformation={[{ height: '120', width: '120', crop: 'at_max' }]}
          responsive={false}
          alt={student.name}
          className="h-24 w-24 shrink-0 rounded-full object-cover border-2 border-muted"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted text-4xl font-bold text-muted-foreground">
          {student.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{student.name}</h1>
        <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {student.motherName && (
            <>
              <dt className="text-muted-foreground">Mother name</dt>
              <dd>{student.motherName}</dd>
            </>
          )}
          {student.motherPhone && (
            <>
              <dt className="text-muted-foreground">Mother phone</dt>
              <dd>{student.motherPhone}</dd>
            </>
          )}
          {student.parent && (
            <>
              <dt className="text-muted-foreground">Parent (user)</dt>
              <dd>{student.parent.name || student.parent.username}</dd>
            </>
          )}
          {student.dateOfBirth && (
            <>
              <dt className="text-muted-foreground">Date of birth</dt>
              <dd>{String(student.dateOfBirth).slice(0, 10)}</dd>
            </>
          )}
          {student.address && (
            <>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="sm:col-span-2">{student.address}</dd>
            </>
          )}
          {student.fee != null && (
            <>
              <dt className="text-muted-foreground">Fee</dt>
              <dd>{typeof student.fee === 'number' ? student.fee : String(student.fee)}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

export function StudentProfile({ student }: { student: Student }) {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      <StudentProfileInner student={student} />
    </ImageKitProvider>
  );
}
