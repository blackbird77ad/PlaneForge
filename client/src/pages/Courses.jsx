import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { getCourses } from '../api/client.js';
import { courses as fallbackCourses } from '../data/catalog.js';
import { CourseCard } from '../components/CourseCard.jsx';

const unique = (key) => Array.from(new Set(fallbackCourses.map((course) => course[key]).filter(Boolean)));

export const Courses = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    discipline: '',
    difficulty: '',
    instructor: '',
    price: '',
    language: '',
    sort: 'popular',
    page: 1,
    limit: 12
  });

  useEffect(() => {
    getCourses(filters).then((data) => {
      setItems(data.courses || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: data.courses?.length || 0 });
    });
  }, [filters]);

  const options = useMemo(
    () => ({
      category: unique('category'),
      discipline: unique('discipline'),
      difficulty: unique('difficulty'),
      language: unique('language')
    }),
    []
  );

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return (
    <main className="section page">
      <div className="page-heading">
        <p className="eyebrow">PLC Courses</p>
        <h1>Find the PLC course that fits the automation work ahead</h1>
        <p>Search, filter, sort, and open full Programmable Logic Controller course pages before enrolling.</p>
      </div>

      <section className="catalog-tools">
        <label className="search-field">
          <Search size={18} />
          <input
            value={filters.search}
            onChange={(event) => update('search', event.target.value)}
            placeholder="Search PLC topics, disciplines, instructors"
          />
        </label>
        <div className="filter-grid">
          {['category', 'discipline', 'difficulty', 'language'].map((key) => (
            <label key={key}>
              <span>{key}</span>
              <select value={filters[key]} onChange={(event) => update(key, event.target.value)}>
                <option value="">All</option>
                {options[key].map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            <span>Instructor</span>
            <input value={filters.instructor} onChange={(event) => update('instructor', event.target.value)} placeholder="Instructor name" />
          </label>
          <label>
            <span>Price</span>
            <select value={filters.price} onChange={(event) => update('price', event.target.value)}>
              <option value="">All prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="under100">Under $100</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select value={filters.sort} onChange={(event) => update('sort', event.target.value)}>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price Low to High</option>
              <option value="priceDesc">Price High to Low</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </label>
        </div>
        <p className="tool-note">
          <SlidersHorizontal size={16} /> {pagination.total} course results
        </p>
      </section>

      <div className="course-grid">
        {items.map((course) => (
          <CourseCard key={course.slug || course._id} course={course} />
        ))}
      </div>

      <div className="pagination">
        <button
          className="button ghost small"
          disabled={filters.page <= 1}
          onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.pages}
        </span>
        <button
          className="button ghost small"
          disabled={filters.page >= pagination.pages}
          onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
        >
          Next
        </button>
      </div>
    </main>
  );
};
