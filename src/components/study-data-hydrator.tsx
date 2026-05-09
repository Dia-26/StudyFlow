"use client";

import { useEffect } from "react";
import { hydrateStudyData } from "@/lib/study-analytics";

export function StudyDataHydrator() {
  useEffect(() => {
    fetch("/api/study-data")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load study data");
        return response.json();
      })
      .then((data) => hydrateStudyData(data))
      .catch(() => {
        // Pages can still use their local mirror if the backend is unavailable.
      });
  }, []);

  return null;
}
