using rkWeb.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace wwwsobi {
  public partial class MvcApplication : rkWeb.Mvc.rkWebApplication {
    public MvcApplication() {
      RegisterBundles += OnRegisterBundles;
      RegisterFilters += OnRegisterGlobalFilters;
      RegisterRoutes += OnRegisterRoutes;
    }
  }
}
