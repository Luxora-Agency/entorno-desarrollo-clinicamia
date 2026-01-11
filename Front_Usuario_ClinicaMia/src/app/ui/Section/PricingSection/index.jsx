import React from 'react';
import Pricing from '../../Pricing';
import SectionHeading from '../../SectionHeading';
import Spacing from '../../Spacing';
import { $api } from '@/utils/openapi-client';

export default function PricingSection({ sectionTitle }) {

  const { data, isLoading } = $api.useQuery("get", "/plans/public", {
    params: {
      query: {
        orderBy: "cost",
        order: "asc",
        limit: 100
      }
    }
  });

  const plans = data?.data || []

  return (
    <div className="container">
      <SectionHeading title={sectionTitle} center />
      <Spacing md="72" lg="50" />
      <div className="row cs_gap_y_50">
        {isLoading && <p>Cargando planes...</p>}
        {plans?.map((item, index) => (
          <div className="col-xl-4" key={index}>
            <Pricing {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
