import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, PackageSearch, Search as SearchIcon } from 'lucide-react';
import { getCourses, getLocalCourseResults, getLocalProductResults, getProducts } from '../api/client.js';
import { CourseCard } from '../components/CourseCard.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { articles, courses as fallbackCourses, products as fallbackProducts } from '../data/catalog.js';

const searchArticles = (query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return articles.slice(0, 4);

  return articles.filter((article) =>
    [article.title, article.excerpt, article.category, article.body]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
};

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [term, setTerm] = useState(query);
  const [courseResults, setCourseResults] = useState(fallbackCourses.slice(0, 6));
  const [productResults, setProductResults] = useState(fallbackProducts.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    setTerm(query);
  }, [query]);

  useEffect(() => {
    let active = true;
    const localData = getLocalCourseResults({ search: query, limit: query ? 9 : 6, sort: 'popular' });
    setCourseResults(localData.courses || []);
    setLoading(true);
    getCourses({ search: query, limit: query ? 9 : 6, sort: 'popular' })
      .then((data) => {
        if (active) setCourseResults(data.courses || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    let active = true;
    const localData = getLocalProductResults({ search: query, limit: query ? 6 : 3, sort: 'newest' });
    setProductResults(localData.products || []);
    setProductsLoading(true);
    getProducts({ search: query, limit: query ? 6 : 3, sort: 'newest' })
      .then((data) => {
        if (active) setProductResults(data.products || []);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  const articleResults = useMemo(() => searchArticles(query), [query]);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = term.trim();
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  return (
    <main className="public-page search-page">
      <section className="public-hero">
        <div className="section-inner public-hero-grid">
          <div>
            <p className="eyebrow">Search PlaneForge</p>
            <h1>Find PCB courses, learning notes, and build support</h1>
            <p>
              Search the public PlaneForge catalog by topic, board type, discipline, difficulty,
              or project outcome.
            </p>
          </div>
          <form className="public-search-card" onSubmit={submit}>
            <SearchIcon size={22} />
            <label htmlFor="site-search">Search</label>
            <input
              id="site-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Try FPGA, USB-C, sensors, DFM"
            />
            <button className="button primary full" type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="section public-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">{query ? 'Product Results' : 'Featured Products'}</p>
            <h2>{query ? `Products matching "${query}"` : 'Hardware products and PCB build resources'}</h2>
          </div>
          <Link className="button ghost small" to={query ? `/products?search=${encodeURIComponent(query)}` : '/products'}>
            Open Products
            <ArrowRight size={16} />
          </Link>
        </div>

        {productsLoading && !productResults.length ? (
          <div className="empty-state compact">
            <PackageSearch size={28} />
            <h2>Searching products</h2>
          </div>
        ) : productResults.length ? (
          <div className="course-grid product-grid">
            {productResults.map((product) => (
              <ProductCard key={product.slug || product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PackageSearch size={28} />
            <h2>No product matches yet</h2>
            <p>Ask PlaneForge to build a similar product for your project.</p>
            <Link className="button primary" to="/products">
              Browse Products
            </Link>
          </div>
        )}
      </section>

      <section className="section public-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">{query ? 'Course Results' : 'Popular Courses'}</p>
            <h2>{query ? `Matching "${query}"` : 'Start with a high-signal PCB project'}</h2>
          </div>
          <Link className="button ghost small" to={query ? `/courses?search=${encodeURIComponent(query)}` : '/courses'}>
            Open Catalog
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading && !courseResults.length ? (
          <div className="empty-state compact">
            <BookOpen size={28} />
            <h2>Searching the catalog</h2>
          </div>
        ) : courseResults.length ? (
          <div className="course-grid">
            {courseResults.map((course) => (
              <CourseCard key={course.slug || course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <SearchIcon size={28} />
            <h2>No course matches yet</h2>
            <p>Try a broader PCB topic or ask PlaneForge for course guidance.</p>
            <Link className="button primary" to="/contact">
              Ask PlaneForge
            </Link>
          </div>
        )}
      </section>

      <section className="section public-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Article Results</p>
            <h2>Notes that help you choose, review, and build better boards</h2>
          </div>
          <Link className="button ghost small" to="/blog">
            Visit Blog
            <FileText size={16} />
          </Link>
        </div>
        <div className="article-grid public-article-grid">
          {articleResults.map((article) => (
            <article className="article-card" key={article.slug || article._id || article.id}>
              <img src={article.image} alt="" loading="lazy" decoding="async" />
              <div>
                <span>
                  {article.category} - {article.readingTime}
                </span>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
