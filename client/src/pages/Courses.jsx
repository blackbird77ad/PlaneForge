import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { getCourses, getLocalCourseResults } from '../api/client.js';
import { courses as fallbackCourses } from '../data/catalog.js';
import { CourseCard } from '../components/CourseCard.jsx';

const unique = (key) => Array.from(new Set(fallbackCourses.map((course) => course[key]).filter(Boolean)));
const filterKeys = ['search', 'category', 'discipline', 'difficulty', 'price', 'language', 'sort', 'page'];
const defaultFilters = {
  search: '',
  category: '',
  discipline: '',
  difficulty: '',
  price: '',
  language: '',
  sort: 'popular',
  page: 1,
  limit: 12
};

const filtersFromParams = (params) => ({
  ...defaultFilters,
  search: params.get('search') || params.get('q') || '',
  category: params.get('category') || '',
  discipline: params.get('discipline') || '',
  difficulty: params.get('difficulty') || '',
  price: params.get('price') || '',
  language: params.get('language') || '',
  sort: params.get('sort') || 'popular',
  page: Number(params.get('page') || 1)
});

const sameFilters = (a, b) =>
  filterKeys.every((key) => String(a[key] || '') === String(b[key] || ''));

export const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = filtersFromParams(searchParams);
  const [initialCatalog] = useState(() => getLocalCourseResults(initialFilters));
  const [items, setItems] = useState(initialCatalog.courses);
  const [pagination, setPagination] = useState(initialCatalog.pagination);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextFilters = filtersFromParams(searchParams);
    setFilters((current) => (sameFilters(current, nextFilters) ? current : nextFilters));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    filterKeys.forEach((key) => {
      const value = filters[key];
      if (value && !(key === 'sort' && value === 'popular') && !(key === 'page' && Number(value) === 1)) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    let active = true;
    const localData = getLocalCourseResults(filters);
    setItems(localData.courses || []);
    setPagination(localData.pagination || { page: 1, pages: 1, total: 0 });
    setLoading(true);
    getCourses(filters)
      .then((data) => {
        if (!active) return;
        setItems(data.courses || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: data.courses?.length || 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
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
  const resetFilters = () => setFilters(defaultFilters);
  const activeFilterCount = ['category', 'discipline', 'difficulty', 'language', 'price'].filter(
    (key) => filters[key]
  ).length;

  return (
    <main className="section page">
      <div className="page-heading">
        <p className="eyebrow">PlaneForge Courses</p>
        <h1 className="readable-page-title course-page-title">
          <span>Learn PCB design with courses built for</span>
          <span>curious makers, students, and engineers</span>
        </h1>
        <p>
          Browse a scalable catalog of project-based PCB courses across beginner builds, embedded
          dev boards, sensors, power electronics, high-speed design, FPGA hardware, robotics, and
          capstones.
        </p>
      </div>

      <div className="track-shortcuts">
        {options.category.slice(0, 8).map((category) => (
          <button
            className={filters.category === category ? 'active' : ''}
            type="button"
            key={category}
            onClick={() => update('category', filters.category === category ? '' : category)}
          >
            {category}
          </button>
        ))}
      </div>

      <section className="catalog-tools">
        <div className="catalog-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Search topics and disciplines"
            />
          </label>
          <button
            className="button ghost filter-toggle"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="course-filters"
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <SlidersHorizontal size={18} />
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            <ChevronDown className={filtersOpen ? 'is-open' : ''} size={17} />
          </button>
          <p className="tool-note">
            {loading && !items.length ? 'Loading catalog' : `${pagination.total} course results`}
          </p>
        </div>
        {filtersOpen && (
          <div className="filter-grid" id="course-filters">
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
            <button className="button ghost small filter-reset" type="button" onClick={resetFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="course-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article className="course-card course-skeleton" key={index}>
              <span />
              <div className="course-card-body">
                <i />
                <strong />
                <p />
                <em />
              </div>
            </article>
          ))}
        </div>
      ) : items.length ? (
        <div className="course-grid">
          {items.map((course) => (
            <CourseCard key={course.slug || course._id} course={course} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h2>No courses found</h2>
          <p>Clear the filters or search a broader PCB topic.</p>
          <button className="button primary" type="button" onClick={resetFilters}>
            Reset Catalog
          </button>
          <Link className="button ghost" to="/contact">
            Ask for Guidance
          </Link>
        </div>
      )}

      {items.length > 0 && (
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
      )}
    </main>
  );
};
