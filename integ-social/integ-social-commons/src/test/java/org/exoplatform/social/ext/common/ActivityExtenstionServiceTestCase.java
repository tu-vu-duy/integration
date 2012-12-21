/*
 * Copyright (C) 2003-2012 eXo Platform SAS.
 *
 * This program is free software; you can redistribute it and/or
* modify it under the terms of the GNU Affero General Public License
* as published by the Free Software Foundation; either version 3
* of the License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, see<http://www.gnu.org/licenses/>.
 */
package org.exoplatform.social.ext.common;

import javax.jcr.ItemExistsException;
import javax.jcr.Node;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.lock.LockException;
import javax.jcr.nodetype.ConstraintViolationException;
import javax.jcr.nodetype.NoSuchNodeTypeException;
import javax.jcr.version.VersionException;

import org.exoplatform.commons.testing.BaseExoTestCase;
import org.exoplatform.component.test.ConfigurationUnit;
import org.exoplatform.component.test.ConfiguredBy;
import org.exoplatform.component.test.ContainerScope;
import org.exoplatform.container.ExoContainerContext;
import org.exoplatform.services.jcr.RepositoryService;
import org.exoplatform.services.jcr.core.ManageableRepository;
import org.exoplatform.services.jcr.ext.app.SessionProviderService;
import org.exoplatform.services.jcr.ext.common.SessionProvider;

/**
 * Created by The eXo Platform SAS
 * Author : Vu Duy Tu
 *          tuvd@exoplatform.com
 * Dec 21, 2012  
 */

@ConfiguredBy({
  @ConfigurationUnit(scope = ContainerScope.PORTAL, path = "conf/exo.portal.component.portal-configuration.xml"),
  @ConfigurationUnit(scope = ContainerScope.PORTAL, path = "conf/exo.portal.component.test.jcr-configuration.xml"),
  @ConfigurationUnit(scope = ContainerScope.PORTAL, path = "conf/exo.portal.component.identity-configuration.xml"),
  @ConfigurationUnit(scope = ContainerScope.PORTAL, path = "conf/portal/exo.social.test.portal-configuration.xml"),
  @ConfigurationUnit(scope = ContainerScope.PORTAL, path = "conf/portal/exo.social.commons-configuration.xml")
})
public class ActivityExtenstionServiceTestCase extends BaseExoTestCase {
  private static final String PATH_TEST = "testsocialcommons";
  private static final String FAKE_ACTIVITY_DI = "activityIdfake";
  
  public ActivityExtenstionServiceTestCase() {
  }

  @Override
  public void setUp() throws Exception {
    begin();
    //

  }

  @Override
  public void tearDown() throws Exception {

    //
    end();
  }
  

  @SuppressWarnings("unchecked")
  public <T> T getService(Class<T> clazz) {
    return (T) getContainer().getComponentInstanceOfType(clazz);
  }
  
  public void testABC() {
    System.out.println("ssss");
  }
  
  public void TestSaveActivityId() throws Exception {
    BaseActivityExtenstionService extensionService = (BaseActivityExtenstionService)getService(ActivityExtensionService.class);
    String patch = makeNodePathTest();
    extensionService.saveActivityId(patch, FAKE_ACTIVITY_DI);
    Node node = (Node)getSession().getItem(patch);
    assertEquals(true, node.isNodeType(BaseActivityExtenstionService.EXO_ACTIVITY_INFO));
    assertEquals(FAKE_ACTIVITY_DI, node.getProperty(BaseActivityExtenstionService.EXO_ACTIVITY_ID).getString());
  }
  
  private String makeNodePathTest() throws Exception {
    Session session = getSession();
    Node newNode = session.getRootNode().addNode(PATH_TEST, "nt:unstructured");
    session.save();
    return newNode.getPath();
  }
  
  private Session getSession() {
    try {
      RepositoryService repositoryService = (RepositoryService) ExoContainerContext.getCurrentContainer()
                                                                                   .getComponentInstanceOfType(RepositoryService.class);
      ManageableRepository repository = repositoryService.getCurrentRepository();
      SessionProviderService sessionProviderService = (SessionProviderService) ExoContainerContext.getCurrentContainer()
                                                                                                  .getComponentInstanceOfType(SessionProviderService.class);
      SessionProvider sessionProvider = sessionProviderService.getSystemSessionProvider(null);
      return sessionProvider.getSession("portal-test", repository);
    } catch (Exception e) {
      return null;
    }
  }
  
}
