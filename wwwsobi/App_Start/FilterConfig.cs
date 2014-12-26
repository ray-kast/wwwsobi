using System.Web;
using System.Web.Mvc;

namespace wwwsobi {
  public partial class MvcApplication {
    void OnRegisterGlobalFilters(GlobalFilterCollection filters) {
      filters.Add(new HandleErrorAttribute());
    }
  }
}
