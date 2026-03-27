import React from "react";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    totalPages,
    currentPage,
    setCurrentPage,
}) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const goToPrev = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="pagination">

            <button
                onClick={goToPrev}
                disabled={currentPage === 1}
            >
                Prev
            </button>

            {pages.map((page) => (
                <button
                    key={page}
                    className={page === currentPage ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
            >
                Next
            </button>

        </div>
    );
};

export default Pagination;