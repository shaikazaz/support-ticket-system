import pymysql

# Django's MySQL backend expects the MySQLdb (mysqlclient) driver, which
# needs a C compiler to build on Windows. PyMySQL is a pure-Python
# equivalent, so we register it as a drop-in replacement here.
pymysql.install_as_MySQLdb()
pymysql.version_info = (1, 4, 6, 'final', 0)  # satisfies Django's version check