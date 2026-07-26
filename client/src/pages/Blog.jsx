import { useEffect, useState } from 'react';
import { getArticles } from '../api/client.js';

export const Blog = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    getArticles().then((data) => setArticles(data.articles || []));
  }, []);

  return (
    <main className="section page">
      <div className="page-heading">
        <p className="eyebrow">Blog</p>
        <h1>Engineering notes for learners and project teams</h1>
        <p>Recent articles that support course discovery, consultation readiness, and career growth.</p>
      </div>
      <div className="article-grid">
        {articles.map((article) => (
          <article className="article-card tall" key={article._id || article.id}>
            <img src={article.image} alt="" />
            <div>
              <span>{article.category} - {article.readingTime}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};
