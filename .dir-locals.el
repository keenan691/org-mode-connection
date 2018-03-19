((nil . (
         (eval . (progn
                   (my/defprojectshortcut ?i "tasks.py")
                   (my/defprojectshortcut ?o "project.org")
                   (my/defprojectshortcut ?r "src/OrgFormat/Regex.js")
                   (my/defprojectshortcut ?t "src/OrgFormat/Transformations.js")
                   (my/defprojectshortcut ?f "src/Helpers/Functions.js")
                   (my/defprojectshortcut ?p "src/OrgFormat/Parser.js")
                   (my/defprojectshortcut ?d "src/Data/Db/Db.js")
                   (my/defprojectshortcut ?q "src/Data/Queries.js")
                   (my/defprojectshortcut ?m "src/Data/Models")
                   (my/defprojectshortcut ?a "src/OrgApi.js")
                   (my/defprojectshortcut ?e "src/OrgFormat/Export.js")
                   (my/defprojectshortcut ?s "src/Data/Sync.js")


                   (setq helm-projectnav-test-dir "__tests__")
                   (setq helm-projectnav-src-dir "src")
                   (setq helm-projectnav-src-suffix ".js")
                   (setq helm-projectnav-test-suffix ".test.js")
                   (setq helm-projectnav-components-dirs
                         '(
                           ("helpers" "src/Helpers" ("index.js" ".story.js" "Styles" ".md") ".js")))

                   (setenv "NODE_PATH"
                           (concat (projectile-project-root) "node_modules" ":"
                                   (projectile-project-root) "src"))

                   (setq helm-directory-basedir (concat (projectile-project-root) "src")))))))
