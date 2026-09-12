using Microsoft.EntityFrameworkCore;
using TeamBoard.Domain;
namespace TeamBoard.Infrastructure;

public sealed class BoardDbContext(DbContextOptions<BoardDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>().Property(x => x.Name).HasMaxLength(100);
        model.Entity<Project>().Property(x => x.Name).HasMaxLength(120);
        model.Entity<ProjectMember>().HasKey(x => new { x.ProjectId, x.UserId });
        model.Entity<ProjectMember>().HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId);
        model.Entity<ProjectMember>().HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<WorkItem>().Property(x => x.Title).HasMaxLength(120);
        model.Entity<WorkItem>().HasOne(x => x.Project).WithMany(x => x.WorkItems).HasForeignKey(x => x.ProjectId);
        // Enforce that an assignee belongs to THIS project, even under concurrent writes.
        model.Entity<WorkItem>().HasOne(x => x.AssigneeMembership).WithMany()
            .HasForeignKey(x => new { x.ProjectId, x.AssigneeId })
            .HasPrincipalKey(x => new { x.ProjectId, x.UserId })
            .OnDelete(DeleteBehavior.Restrict);
        model.Entity<Comment>().Property(x => x.Text).HasMaxLength(1000);
        model.Entity<Comment>().HasOne(x => x.WorkItem).WithMany(x => x.Comments).HasForeignKey(x => x.WorkItemId);
        model.Entity<Comment>().HasOne(x => x.Author).WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
    }
}
