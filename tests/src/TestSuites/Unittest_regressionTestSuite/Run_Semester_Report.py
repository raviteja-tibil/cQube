import time
from SR import semester_report_regression_testing
from get_dir import pwd
import unittest
from HTMLTestRunner import HTMLTestRunner

from reuse_func import GetData


class MyTestSuite(unittest.TestCase):

    @classmethod
    def setUpClass(self):
        self.data = GetData()
        self.driver = self.data.get_driver()
        self.data.open_cqube_appln(self.driver)
        self.data.login_cqube(self.driver)

    def test_Issue(self):
        self.data.navigate_to_semester_report()
        time.sleep(2)
        self.errMsg = self.data.get_data_status()
        if self.errMsg.text == 'No data found':
            print("No data in the semester report page")
        else:
            regression_test = unittest.TestSuite()
            regression_test.addTests([
                # file name .class name
                unittest.defaultTestLoader.loadTestsFromTestCase(semester_report_regression_testing.cQube_Semester_Report),
            ])
            p = pwd()
            outfile = open(p.get_regression_report_path(), "a")

            runner1 = HTMLTestRunner.HTMLTestRunner(
                stream=outfile,
                title='Semester Regression Test Report',
                verbosity=1,

            )

            runner1.run(regression_test)
            outfile.close()


    @classmethod
    def tearDownClass(self):
        self.driver.close()


if __name__ == '__main__':
    unittest.main()