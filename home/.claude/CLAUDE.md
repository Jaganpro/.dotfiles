# File search

When the `fff` MCP tools are available (they are in project folders, not in
the home folder), prefer them over built-in search for any file search or grep
inside the current git repository:

- `find_files` to locate files by name, `grep` / `multi_grep` to search contents.
- Include the known directory or module in the first search to keep results tight.
- Use `definitions_only` when looking for where something is declared.
- Read more of a file only when the returned lines need more context.

If `fff` isn't connected, use the built-in tools as usual.
