# Item Catalog: The Massive Online Course Catalog

### About

This application provides a list of items within a variety of categories and provides a user registration and authentication system. Users only with a GitHub account will have the ability to post, edit and delete their own items.

### How to run

This simple web application uses GitHub for authorization and authentication.  To simulate security best practices, the API keys are not in the main application file or hard-coded.  However, to facilitate grading, a shell script, `export_keys.sh`, is available to export API keys (current as of the time of submission) to server environment variables.

To spin this website up: --Windows

1. Download the project directory.
2. Install [Vagrant](https://www.vagrantup.com/)
3. Open the command prompt as Administrator
4. Navigate to "vagrant" directory
5. Execute the following commands:
  a. vagrant up
  b. vagrant ssh (Get the IP and port from the output of this command)
6. Download PuTTy(http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html) & run as admin.
7. Input the IP & Port No. from above output.
8. Click Launch
9. Input vagrant as username as well as password
10. This should setup server on `localhost:5000`.
11. Obtain your own GitHub API keys by [registering a new application](https://github.com/settings/applications).  Ensure you add `localhost:5000/github-callback` as the authorization callback URL.
12. Inside the vagrant directory, open `export_keys.sh` file and edit your own API keys, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` the one that you obtained in Step 7.
13. Now navigate to the catalog directory: `cd /vagrant/catalog`
14. Run the provided key export shell script using the following command: `source ../export_keys.sh`.
15. (Optional but preferred) Delete the `catalog.db` file and build the database file again using: `python database_setup.py`
16. Start the server: `python application.py`.
17. Navigate to your browser at `localhost:5000`.  
18. This first-time run of the server will initialize the database with fixture data.