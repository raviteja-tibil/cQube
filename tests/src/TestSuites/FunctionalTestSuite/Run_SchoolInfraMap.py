import time
from get_dir import pwd
from SI.MAP import School_Map_functional_testing

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
        self.data.navigate_to_school_infrastructure_map()
        time.sleep(2)
        self.errMsg = self.data.get_data_status()
        if self.errMsg.text == 'No data found':
            print("No data in the school infra map page")
        else:
            functional_test = unittest.TestSuite()
            functional_test.addTests([
                # file name .class name
                unittest.defaultTestLoader.loadTestsFromTestCase(School_Map_functional_testing.cQube_SI_Map_Report),
            ])
            p= pwd()
            outfile = open(p.get_functional_report_path(), "a")

            runner1 = HTMLTestRunner.HTMLTestRunner(
                stream=outfile,
                title='School Infra Map Functional Test Report',
                verbosity=1,
            )

            runner1.run(functional_test)
            outfile.close()

    @classmethod
    def tearDownClass(self):
        self.driver.close()

if __name__ == '__main__':
    unittest.main()