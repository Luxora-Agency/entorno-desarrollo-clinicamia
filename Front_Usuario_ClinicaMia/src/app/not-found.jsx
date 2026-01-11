import React from 'react'
import SectionHeading from './ui/SectionHeading';
import Spacing from './ui/Spacing';
import Button from './ui/Button';
export const metadata = {
  title: "404 - Page not Found..!",
};

export default function PageNotFound() {
  return (
    <div className="cs_error cs_center text-center cs_gray_bg_1">
      <div className="container">
        <SectionHeading
          title="This page could <br> not be found."
          titleUp="404 Errro"
          variantColor="cs_white_color"
        />
        <Spacing lg="30" md="30" />
        <Button btnText="Back To Home" btnUrl="/" />
      </div>
    </div>
  )
}
