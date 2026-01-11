import Image from 'next/image';
import React from 'react';

export default function Pagination({
  page,
  setPage,
  totalPages,
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber);
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page or no pages
  }

  const pageNumbers = getPageNumbers();

  return (
    <ul className="cs_pagination_box">
      <li>
        <button
          className="cs_pagination_arrow cs_center"
          onClick={handlePrevious}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <Image src="/images/icons/left_arrow_blue.svg" alt="Icon" height={11} width={16} />
        </button>
      </li>
      {pageNumbers.map((pageNum, index) => (
        <li key={`page-${pageNum}-${index}`}>
          {pageNum === '...' ? (
            <span className="cs_pagination_item cs_center">...</span>
          ) : (
            <button
              className={`cs_pagination_item cs_center ${page === pageNum ? 'active' : ''}`}
              onClick={() => handlePageClick(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={page === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )}
        </li>
      ))}
      <li>
        <button
          className="cs_pagination_arrow cs_center"
          onClick={handleNext}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <Image src="/images/icons/right_arrow_blue.svg" alt="Icon" height={11} width={16} />
        </button>
      </li>
    </ul>
  );
}
