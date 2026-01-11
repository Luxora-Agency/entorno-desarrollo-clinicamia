import React from 'react';
import SectionHeading from '../../SectionHeading';
import Spacing from '../../Spacing';
import Accordion from '../../Accordion';
import Image from 'next/image';

export default function FaqSectionStyle4({
  data,
  sectionTitle,
  faqImgUrl,
  spiningImgUrl,
}) {
  return (
    <div className="container">
      <SectionHeading title={sectionTitle} />
      <Spacing md="72" lg="50" />
      <div className="row cs_gap_y_40">
        <div className={faqImgUrl ? "col-xl-8" : "col-xl-12"}>
          <Accordion variant="cs_style1 cs_type_3" data={data} />
        </div>
        {faqImgUrl && (
          <div className="col-xl-4">
            <div className="cs_about cs_style_1 cs_type_2">
              <div className="cs_about_img">
                <Image src={faqImgUrl} alt="About" className="w-100" placeholder='blur' />
                {spiningImgUrl && (
                  <div className="cs_about_mini_img">
                    <Image
                      src={spiningImgUrl}
                      alt="Mini"
                      className="cs_rotate_animation"
                      height={191} width={191}
                    />
                    <Image
                      src="/images/icons/tick.svg"
                      alt="Right"
                      className="cs_right_icon"
                      height={48} width={48}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
