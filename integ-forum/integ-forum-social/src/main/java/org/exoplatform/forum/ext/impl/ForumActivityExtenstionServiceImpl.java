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
package org.exoplatform.forum.ext.impl;

import javax.jcr.RepositoryException;

import org.exoplatform.container.xml.InitParams;
import org.exoplatform.social.ext.common.BaseActivityExtenstionService;

/**
 * Created by The eXo Platform SAS
 * Author : Vu Duy Tu
 *          tuvd@exoplatform.com
 * Dec 21, 2012  
 */
public class ForumActivityExtenstionServiceImpl extends BaseActivityExtenstionService {
  
  public ForumActivityExtenstionServiceImpl(InitParams params) {
    super(params);
  }

  @Override
  public void saveActivityId(String path, String activityId) throws RepositoryException {
    super.saveActivityId(path, activityId);
  }

  @Override
  public String getActivityId(String path) throws Exception {
    return super.getActivityId(path);
  }
  
  @Override
  public void setWorkSpaceName(String workspaceName) {
    super.setWorkSpaceName(workspaceName);
  }
}
