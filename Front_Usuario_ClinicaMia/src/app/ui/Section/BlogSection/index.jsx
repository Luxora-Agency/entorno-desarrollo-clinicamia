import React from 'react';
import SectionHeading from '../../SectionHeading';
import Spacing from '../../Spacing';
import Post from '../../Post';
import { $api } from '@/utils/openapi-client';

export default function BlogSection({
  sectionTitle,
  sectionTitleUp,
  sectionTitleDown,
  sectionSubTitle,
}) {

  const { data } = $api.useQuery("get", "/posts/public", {
    params: {
      query: {
        populate: "author,featuredImage,tags,postCategory",
        orderBy: "publishedAt",
        order: "desc",
        limit: 3
      }
    }
  })

  const posts = data?.data

  return (
    <div className="container">
      <SectionHeading
        title={sectionTitle}
        titleUp={sectionTitleUp}
        titleDown={sectionTitleDown}
        subTitle={sectionSubTitle}
        center
      />
      <Spacing md="72" lg="50" />
      <div className="row gy-4">
        {posts?.map((item, index) => (
          <div className="col-lg-4" key={index}>
            <Post {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
