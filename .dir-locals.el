;;; Settings

((nil . (
         (eval . (progn

;;;; Project schortcuts

                   (my/defprojectshortcut ?x "src/Helpers/Debug.js")
                   (my/defprojectshortcut ?i "tasks.py")
                   (my/defprojectshortcut ?o "project.org")
                   (my/defprojectshortcut ?r "src/OrgFormat/Regex.js")
                   (my/defprojectshortcut ?t "src/OrgFormat/Transforms.js")
                   (my/defprojectshortcut ?f "src/Helpers/Functions.js")
                   (my/defprojectshortcut ?p "package.json")
                   (my/defprojectshortcut ?d "src/index.d.ts")
                   ;; (my/defprojectshortcut ?d "src/Data/Db/Db.js")
                   ;; (my/defprojectshortcut ?q "src/Data/Queries.js")
                   ;; (my/defprojectshortcut ?m "src/Data/Models")
                   ;; (my/defprojectshortcut ?a "src/OrgApi.js")
                   ;; (my/defprojectshortcut ?e "src/OrgFormat/Export.js")
                   ;; (my/defprojectshortcut ?s "src/Data/Sync.js")

;;;; Helm-projectnav

                   (setq helm-projectnav-test-dir "__tests__")
                   (setq helm-projectnav-src-dir "src")
                   (setq helm-projectnav-src-suffix ".js")
                   (setq helm-projectnav-test-suffix ".test.js")
                   (setq helm-projectnav-components-dirs
                         '(
                           ("helpers" "src/Helpers" ("index.js" ".story.js" "Styles" ".md") ".js")
                           ("org" "src/OrgFormat" ("index.js" ".story.js" "Styles" ".md") ".js")
                           ("atomic parsers" "src/OrgFormat/AtomicParsers" ("index.js" ".story.js" "Styles" ".md") ".js")
                           ("generic parsers" "src/OrgFormat/GenericParsers" ("index.js" ".story.js" "Styles" ".md") ".js")))

                   (setenv "NODE_PATH"
                           (concat (projectile-project-root) "node_modules" ":"
                                   (projectile-project-root) "src"))

                   (setq helm-directory-basedir (concat (projectile-project-root) "src")))))))
