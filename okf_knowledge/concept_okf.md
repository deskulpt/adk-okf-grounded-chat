---
type: concept
title: "Open Knowledge Format"
tags: ["okf", "knowledge", "git-based"]
description: "Information about Open Knowledge Format"
---
The **Open Knowledge Format (OKF)** is a Git-based repository standard for storing grounded context.
It represents information as Markdown files with YAML frontmatter. Only the `type` field is mandatory in the frontmatter.
OKF ensures that agents prioritize local, verified ground-truth concepts before falling back to general LLM generation.
