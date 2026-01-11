import React from 'react';
import Link from 'next/link';
import Spacing from '../Spacing';
import { Icon } from '@iconify/react';
import Image from 'next/image';

export default function CommentsWidget({ title }) {
  return (
    <div id="comments" className="comments-area">
      <h2 className="comments-title cs-semi_bold cs_fs_24 cs_semibold mb-0">
        {title}
      </h2>
      <Spacing md="45" />
      <ol className="comment-list">
        <li className="comment">
          <div className="comment-body">
            <div className="comment-author vcard">
              <Image
                className="avatar"
                src="/images/blog/avatar_1.png"
                alt="Author"
                height={60} width={60}
              />
              <Link href="/" className="url">
                George Steven
              </Link>
            </div>
            <div className="comment-meta">
              <Icon icon="fa6-solid:clock" />
              <Link href="/">Jan 24, 2023 </Link>
            </div>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation.
            </p>
            <div className="reply">
              <Link className="comment-reply-link" href="/">
                Reply
              </Link>
            </div>
          </div>
          <ol className="children">
            <li className="comment">
              <div className="comment-body">
                <div className="comment-author vcard">
                  <Image
                    className="avatar"
                    src="/images/blog/avatar_2.png"
                    alt="Author"
                    height={60} width={60}
                  />
                  <Link href="/" className="url">
                    Sarah Taylor
                  </Link>
                </div>
                <div className="comment-meta">
                  <Icon icon="fa6-solid:clock" />
                  <Link href="/">Jan 24, 2022 at 9:59 am </Link>
                </div>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud.
                </p>
                <div className="reply">
                  <Link className="comment-reply-link" href="/">
                    Reply
                  </Link>
                </div>
              </div>
            </li>
            {/* #comment-## */}
          </ol>
          {/* .children */}
        </li>
        {/* #comment-## */}
        <li className="comment">
          <div className="comment-body">
            <div className="comment-author vcard">
              <Image
                className="avatar"
                src="/images/blog/avatar_3.png"
                alt="Author"
                height={60} width={60}
              />
              <Link href="/" className="url">
                Jhon Doe
              </Link>
            </div>
            <div className="comment-meta">
              <Icon icon="fa6-solid:clock" />
              <Link href="/">Jan 24, 2022 at 9:59 am </Link>
            </div>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore
            </p>
            <div className="reply">
              <Link className="comment-reply-link" href="/">
                Reply
              </Link>
            </div>
          </div>
        </li>
        {/* #comment-## */}
      </ol>
      {/* .comment-list */}
    </div>
  );
}
