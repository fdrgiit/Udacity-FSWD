# Tournament Planner

This project provides a Python module that uses a PostgreSQL database to keep track of players and matches in a game tournament, using the Swiss pairing system.

### How to run --Windows

1. Install [Vagrant](https://www.vagrantup.com/)
2. Open the command prompt as Administrator
3. Navigate to "vagrant" directory
4. Execute the following commands:
  a. vagrant up
  b. vagrant ssh (Get the IP and port from the output of this command)
5. Download PuTTy(http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html)
6. Input the IP & Port No. from above output.
7. Click Launch
8. Input vagrant as username as well as password
9. Now run "python tournament_test.py"

Note that the test suite wipes and adds records to the database, so in the off chance that you are using this in a production environment, do not execute it!