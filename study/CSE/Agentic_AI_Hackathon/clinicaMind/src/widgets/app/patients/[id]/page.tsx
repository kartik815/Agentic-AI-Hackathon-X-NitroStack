import React from 'react';
import { PatientProfileClient } from './PatientProfileClient';

export function generateStaticParams() {
  return [
    { id: '1234' },
    { id: '5678' },
    { id: '9012' }
  ];
}

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  return <PatientProfileClient id={params.id} />;
}
