using Microsoft.EntityFrameworkCore;
using TeamBoard.Domain;
namespace TeamBoard.Infrastructure;

public static class Seed
{
    public static async Task ApplyAsync(BoardDbContext db, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct)) return;
        db.Users.AddRange(new User { Id = 1, Name = "Nora" }, new User { Id = 2, Name = "Omar" }, new User { Id = 3, Name = "Lina" });
        db.Projects.AddRange(new Project { Id = 1, Name = "TeamBoard" }, new Project { Id = 2, Name = "Other project" });
        db.ProjectMembers.AddRange(new ProjectMember { ProjectId = 1, UserId = 1 }, new ProjectMember { ProjectId = 1, UserId = 2 }, new ProjectMember { ProjectId = 2, UserId = 3 });
        db.WorkItems.Add(new WorkItem { Title = "Read Program.cs", ProjectId = 1 });
        await db.SaveChangesAsync(ct);
        if (db.Database.IsNpgsql())
        {
            // Explicit fixture IDs do not advance PostgreSQL identity sequences.
            await db.Database.ExecuteSqlRawAsync("""
                SELECT setval(pg_get_serial_sequence('"Projects"', 'Id'), (SELECT MAX("Id") FROM "Projects"));
                SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), (SELECT MAX("Id") FROM "Users"));
                """, ct);
        }
    }
}
