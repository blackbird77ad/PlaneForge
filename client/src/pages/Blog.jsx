import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, Search } from 'lucide-react';
import { getArticles } from '../api/client.js';
import { articles as fallbackArticles } from '../data/catalog.js';

export const Blog = () => {
  const [articles, setArticles] = useState(fallbackArticles);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    getArticles().then((data) => {
      setArticles(data.articles?.length ? data.articles : fallbackArticles);
    });
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(fallbackArticles.map((article) => article.category)))],
    []
  );

  const visibleArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = category === 'All' || article.category === category;
      const matchesQuery =
        !normalized ||
        [article.title, article.excerpt, article.category]
          .join(' ')
          .toLowerCase()
          .includes(normalized);

      return matchesCategory && matchesQuery;
    });
  }, [articles, category, query]);

  return (
    <main className="public-page blog-page">
      <section className="public-hero">
        <div className="section-inner public-hero-grid">
          <div>
            <p className="eyebrow">PlaneForge Blog</p>
            <h1>Engineering notes for PCB learners and hardware teams</h1>
            <p>
              Practical articles on PCB learning paths, board review, consulting readiness,
              manufacturing files, bring-up, and project decisions.
            </p>
          </div>
          <label className="public-search-card">
            <Search size={22} />
            <span>Search articles</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PCB topics"
            />
          </label>
        </div>
      </section>

      <section className="section public-section">
        <div className="category-tabs" aria-label="Article categories">
          {categories.map((item) => (
            <button
              className={category === item ? 'active' : ''}
              type="button"
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="article-grid public-article-grid">
          {visibleArticles.map((article) => (
            <article className="article-card tall" id={article.slug} key={article._id || article.id}>
              <img src={article.image} alt="" loading="lazy" decoding="async" />
              <div>
                <span>
                  {article.category} - {article.readingTime}
                </span>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <a href={`#${article.slug || article._id || article.id}`}>
                  Read Note
                  <ArrowRight size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>

        {visibleArticles.length === 0 && (
          <div className="empty-state">
            <Clock size={28} />
            <h2>No articles match that search</h2>
            <p>Try a broader PCB topic, or clear the category filter.</p>
          </div>
        )}
      </section>
    </main>
  );
};
