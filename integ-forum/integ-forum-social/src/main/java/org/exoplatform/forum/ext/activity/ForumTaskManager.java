/*
 * Copyright (C) 2003-2014 eXo Platform SAS.
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
package org.exoplatform.forum.ext.activity;

import java.util.Calendar;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

import org.exoplatform.services.log.ExoLogger;
import org.exoplatform.services.log.Log;
import org.exoplatform.social.core.activity.model.ExoSocialActivity;
import org.picocontainer.Startable;

public class ForumTaskManager implements Startable {
  private static final Log    LOG              = ExoLogger.getExoLogger(ForumTaskManager.class);
  private static final long   INTERVAL         = 10000l;
  private static final int    MAX_SIZE_PERSIST = 10;
  private static Queue<Task<ForumActivityContext>> tasks = new ConcurrentLinkedQueue<Task<ForumActivityContext>>();
  private transient final ReentrantLock lock = new ReentrantLock();
  private boolean isDone = true;
  private final ScheduledExecutorService scheduler     = Executors.newScheduledThreadPool(1);

  @Override
  public void start() {
    try {
      makeInterval();
    } catch (Exception e) {
      
    }
  }

  @Override
  public void stop() {
  }

  private void makeInterval() {
    //
    scheduler.scheduleWithFixedDelay(new Runnable() {
      @Override
      public void run() {
        persisterTask();
      }
    }, 30000, INTERVAL, TimeUnit.MILLISECONDS);
  }
  
  public void addTask(Task<ForumActivityContext> task) {
    tasks.add(task);
    //
    persisterTask();
  }

  public void persisterTask() {
    //
    if (!isDone) {
      return;
    }
    final ReentrantLock lock = this.lock;
    lock.lock();
    isDone = false;
    try {
      //
      int count = 0;
      Task<ForumActivityContext> task;
      while (count < MAX_SIZE_PERSIST && (task = tasks.poll()) != null) {
        ActivityTask<ForumActivityContext> activityTask = task.getTask();
        //
        ExoSocialActivity got = ActivityExecutor.execute(activityTask, task.getContext());
        //
        if (activityTask instanceof PostActivityTask) {
          //
          PostActivityTask task_ = PostActivityTask.ADD_POST;
          if (got != null && activityTask.equals(task_)) {
            Thread.sleep(200);
            //
            ForumActivityUtils.takeCommentBack(task.getContext().getPost(), got);
          }
        } else if (activityTask instanceof TopicActivityTask) {
          //
          TopicActivityTask task_ = TopicActivityTask.ADD_TOPIC;
          if (got != null && activityTask.equals(task_)) {
            ForumActivityUtils.takeActivityBack(task.getContext().getTopic(), got);
          }
        }
        //
        ++count;
      }
    } catch (Exception e) {
      LOG.warn("Running task of forum activity unsuccessful.");
      LOG.debug(e.getMessage(), e);
    } finally {
      isDone = true;
      lock.unlock();
    }
  }

  public static class Task<T> {
    private ForumActivityContext ctx;
    private ActivityTask<T>      task;
    private long                 time = 0l;

    public Task(ForumActivityContext ctx, ActivityTask<T> task) {
      this.ctx = ctx;
      this.task = task;
      time = Calendar.getInstance().getTimeInMillis();
    }

    public long getTime() {
      return time;
    }

    public ForumActivityContext getContext() {
      return ctx;
    }

    public ActivityTask<T> getTask() {
      return task;
    }
  }

}
