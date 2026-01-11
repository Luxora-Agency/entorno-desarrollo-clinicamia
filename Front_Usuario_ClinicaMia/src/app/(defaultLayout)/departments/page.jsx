
import React from 'react';
import Section from '@/app/ui/Section';
import BannerSectionStyle5 from '@/app/ui/Section/BannerSection/BannerSectionStyle5';
import BannerSectionStyle6 from '@/app/ui/Section/BannerSection/BannerSectionStyle6';
import DepartmentSectionStyle3 from '@/app/ui/Section/DepartmentSection/DepartmentSectionStyle3';

import bannerImg from '../../../../public/images/departments/banner_img.png'
import bannerImg2 from '../../../../public/images/departments/banner_img_2.png'


const departmentData = [
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Emergency Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Cardiology Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Pediatric Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Obstetrics and Gynecology',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Psychiatry Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Neurology Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Occupational Therapy Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
  {
    iconUrl: '/images/departments/icon_1.svg',
    title: 'Physical Therapy Department',
    subTitle:
      'This department provides immediate medical care to patients with acute illnesses or injuries that require immediate attention.',
    href: '/departments/department-details',
  },
];

export default function Departments() {
  return (
    <>
      <BannerSectionStyle5
        bgUrl="/images/departments/banner_bg.svg"
        imgUrl={bannerImg}
        title="Get to Know <br>ProHealth Departments"
        subTitle="At ProHealth, we offer a wide range of medical and healthcare services that are designed to meet your individual needs and help you achieve optimal health."
      />
      <Section bottomMd={140} bottomLg={100} bottomXl={60}>
        <DepartmentSectionStyle3 data={departmentData} />
      </Section>
      <Section className="cs_footer_margin_0">
        <BannerSectionStyle6
          imgUrl={bannerImg2}
          title="Don’t Let Your Health Take a Backseat!"
          subTitle="Schedule an appointment with one of our <br />experienced medical professionals today!"
        />
      </Section>
    </>
  );
}
