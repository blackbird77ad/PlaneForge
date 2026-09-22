import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, PackageSearch, Search, SlidersHorizontal } from 'lucide-react';
import { getLocalProductResults, getProducts } from '../api/client.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { products as fallbackProducts } from '../data/catalog.js';

const unique = (key) =>
  Array.from(new Set(fallbackProducts.map((product) => product[key]).filter(Boolean)));

const filterKeys = ['search', 'category', 'type', 'price', 'sort', 'page'];
const defaultFilters = {
  search: '',
  category: '',
  type: '',
  price: '',
  sort: 'newest',
  page: 1,
  limit: 12
};

const filtersFromParams = (params) => ({
  ...defaultFilters,
  search: params.get('search') || params.get('q') || '',
  category: params.get('category') || '',
  type: params.get('type') || '',
  price: params.get('price') || '',
  sort: params.get('sort') || 'newest',
  page: Number(params.get('page') || 1)
});

const sameFilters = (a, b) =>
  filterKeys.every((key) => String(a[key] || '') === String(b[key] || ''));

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = filtersFromParams(searchParams);
  const [initialCatalog] = useState(() => getLocalProductResults(initialFilters));
  const [items, setItems] = useState(initialCatalog.products);
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
      if (value && !(key === 'sort' && value === 'newest') && !(key === 'page' && Number(value) === 1)) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    let active = true;
    const localData = getLocalProductResults(filters);
    setItems(localData.products || []);
    setPagination(localData.pagination || { page: 1, pages: 1, total: 0 });
    setLoading(true);
    getProducts(filters)
      .then((data) => {
        if (!active) return;
        setItems(data.products || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: data.products?.length || 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  const categories = useMemo(() => unique('category'), []);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const resetFilters = () => setFilters(defaultFilters);
  const activeFilterCount = ['category', 'type', 'price'].filter((key) => filters[key]).length;

  return (
    <main className="section page products-page">
      <div className="page-heading">
        <p className="eyebrow">PlaneForge Products</p>
        <h1 className="readable-page-title">Hardware products, kits, and digital PCB tools</h1>
        <p>
          Buy published PlaneForge products directly, or open a product page to request a similar
          build made for your project.
        </p>
      </div>

      <section className="catalog-tools">
        <div className="catalog-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Search products, kits, templates, or SKUs"
            />
          </label>
          <button
            className="button ghost filter-toggle"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="product-filters"
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <SlidersHorizontal size={18} />
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            <ChevronDown className={filtersOpen ? 'is-open' : ''} size={17} />
          </button>
          <p className="tool-note">
            {loading && !items.length ? 'Loading products' : `${pagination.total} product results`}
          </p>
        </div>
        {filtersOpen && (
          <div className="filter-grid" id="product-filters">
            <label>
              <span>Category</span>
              <select value={filters.category} onChange={(event) => update('category', event.target.value)}>
                <option value="">All</option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Type</span>
              <select value={filters.type} onChange={(event) => update('type', event.target.value)}>
                <option value="">All types</option>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </label>
            <label>
              <span>Price</span>
              <select value={filters.price} onChange={(event) => update('price', event.target.value)}>
                <option value="">All prices</option>
                <option value="under50">Under $50</option>
                <option value="under100">Under $100</option>
                <option value="over100">Over $100</option>
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select value={filters.sort} onChange={(event) => update('sort', event.target.value)}>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
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
        <div className="course-grid product-grid">
          {items.map((product) => (
            <ProductCard key={product.slug || product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageSearch size={28} />
          <h2>No products found</h2>
          <p>Clear the filters or request the hardware product you want PlaneForge to build.</p>
          <button className="button primary" type="button" onClick={resetFilters}>
            Reset Products
          </button>
          <Link className="button ghost" to="/contact">
            Request a Build
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
