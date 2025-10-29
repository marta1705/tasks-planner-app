import React, { createContext, useContext, useState } from "react";

const TagsContext = createContext();

export function TagsProvider({ children }) {
  const [tags, setTags] = useState(["#praca", "#nauka", "#zdrowie"]);
  const [filterTags, setFilterTags] = useState([]);

  const addTag = (tag) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      let tagText = tag.trim();
      if (!tagText.startsWith("#")) {
        tagText = "#" + tagText;
      }
      setTags((prevTags) => [...prevTags, tagText]);
    }
  };

  const deleteTag = (tag) => {
    setTags((prevTags) => prevTags.filter((t) => t !== tag));
    setFilterTags((prevFilterTags) => prevFilterTags.filter((t) => t !== tag));
  };

  const toggleFilterTag = (tag) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <TagsContext.Provider
      value={{ tags, addTag, deleteTag, filterTags, toggleFilterTag }}
    >
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  return useContext(TagsContext);
}
