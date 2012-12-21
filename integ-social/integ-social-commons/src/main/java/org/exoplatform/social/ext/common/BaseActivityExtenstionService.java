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

import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import javax.jcr.query.QueryResult;

import org.exoplatform.container.ExoContainerContext;
import org.exoplatform.container.xml.InitParams;
import org.exoplatform.services.jcr.RepositoryService;
import org.exoplatform.services.jcr.core.ManageableRepository;
import org.exoplatform.services.jcr.ext.app.SessionProviderService;
import org.exoplatform.services.jcr.ext.common.SessionProvider;
import org.exoplatform.services.log.ExoLogger;
import org.exoplatform.services.log.Log;

/**
 * Created by The eXo Platform SAS
 * Author : Vu Duy Tu
 *          tuvd@exoplatform.com
 * Dec 21, 2012  
 */
public class BaseActivityExtenstionService implements ActivityExtensionService {
  private static final Log LOG               = ExoLogger.getLogger(ActivityExtensionService.class);

  public static String     WORK_SPACE_NAME   = "workspace";

  public static String     EXO_ACTIVITY_INFO = "exo:activityInfo";

  public static String     EXO_ACTIVITY_ID   = "exo:activityId";

  public String            workspaceName     = "portal-system";

  public BaseActivityExtenstionService(InitParams params) {
    String workspaceName = params.getValueParam(WORK_SPACE_NAME).getValue();
    if (workspaceName != null && workspaceName.length() > 0) {
      this.workspaceName = workspaceName;
    }
  }
  
  public void setWorkSpaceName(String workspaceName) {
    this.workspaceName = workspaceName;
  }

  @Override
  public void saveActivityId(String path, String activityId) throws RepositoryException {
    try {
      Node node = getNode(path);
      if (!node.isNodeType(EXO_ACTIVITY_INFO)) {
        node.addMixin(EXO_ACTIVITY_INFO);
      }
      node.setProperty(EXO_ACTIVITY_ID, activityId);
      node.save();
    } catch (RepositoryException e) {
      LOG.error(e);
    }
  }

  @Override
  public String getActivityId(String path) throws Exception {
    try {
      Node node = getNode(path);
      return node.getProperty(EXO_ACTIVITY_ID).getString();
    } catch (PathNotFoundException e) {
      return null;
    }
  }

  private Node getNode(String path) throws RepositoryException {
    Session session = getSession();
    path = (path.indexOf("/") == 0) ? path.substring(1) : path;
    if (session.getRootNode().hasNode(path)) {
      return session.getRootNode().getNode(path);
    } else {
      if (path.indexOf("/") > -1) {
        path = path.substring(path.lastIndexOf("/"));
      }
      QueryManager qm = session.getWorkspace().getQueryManager();

      StringBuffer stringBuffer = new StringBuffer("/jcr:root")
          .append("//* [(fn:name()='") .append(path).append("')]");

      Query query = qm.createQuery(stringBuffer.toString(), Query.XPATH);
      QueryResult result = query.execute();
      NodeIterator iter = result.getNodes();
      if (iter.getSize() > 0)
        return iter.nextNode();
    }
    return null;
  }

  private Session getSession() {
    try {
      RepositoryService repositoryService = (RepositoryService) ExoContainerContext.getCurrentContainer()
                                                                                   .getComponentInstanceOfType(RepositoryService.class);
      ManageableRepository repository = repositoryService.getCurrentRepository();
      SessionProviderService sessionProviderService = (SessionProviderService) ExoContainerContext.getCurrentContainer()
                                                                                                  .getComponentInstanceOfType(SessionProviderService.class);
      SessionProvider sessionProvider = sessionProviderService.getSystemSessionProvider(null);
      return sessionProvider.getSession(workspaceName, repository);
    } catch (Exception e) {
      return null;
    }
  }
}
